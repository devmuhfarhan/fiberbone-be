import pool from '../config/db';
import * as inventoryModel from '../models/inventoryModel';
import * as journalService from './journalService';
import { findByCodeAndOutletId } from '../models/accountModel';
import logger from '../utils/logger';

// Add new stock (IN)
export const addStock = async (
  outletId: string,
  productId: string,
  quantity: number,
  unitCost: number,
  referenceType?: string,
  referenceId?: string,
  notes?: string
) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Create a new inventory batch
    await inventoryModel.createBatch({
      outlet_id: outletId,
      product_id: productId,
      quantity,
      quantity_available: quantity,
      unit_cost: unitCost
    }, client);

    // 2. Create inventory transaction
    const totalCost = quantity * unitCost;
    await inventoryModel.createTransaction({
      outlet_id: outletId,
      product_id: productId,
      type: 'IN',
      quantity,
      total_cost: totalCost,
      reference_type: referenceType,
      reference_id: referenceId,
      notes
    }, client);

    // 3. Update total stock in products table
    const currentStock = await inventoryModel.getProductStock(productId, outletId, client);
    await inventoryModel.updateProductStock(productId, outletId, Number(currentStock) + quantity, client);

    await client.query('COMMIT');
    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error in inventoryService.addStock', error);
    throw error;
  } finally {
    client.release();
  }
};

// Remove stock using FIFO (OUT)
export const removeStock = async (
  outletId: string,
  productId: string,
  quantityToRemove: number,
  referenceType?: string,
  referenceId?: string,
  notes?: string
): Promise<number> => { // returns the total cost (HPP) of the removed stock
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const currentStock = await inventoryModel.getProductStock(productId, outletId, client);
    if (Number(currentStock) < quantityToRemove) {
      throw new Error('Insufficient stock');
    }

    // Get available batches ordered by date (FIFO)
    const batches = await inventoryModel.getAvailableBatchesByProductId(outletId, productId, client);
    
    let remainingToRemove = quantityToRemove;
    let totalCost = 0;

    for (const batch of batches) {
      if (remainingToRemove <= 0) break;

      const takeQty = Math.min(batch.quantity_available, remainingToRemove);
      const newQtyAvailable = batch.quantity_available - takeQty;
      
      // Update batch
      await inventoryModel.updateBatchQuantity(batch.id, newQtyAvailable, client);
      
      totalCost += takeQty * Number(batch.unit_cost);
      remainingToRemove -= takeQty;
    }

    if (remainingToRemove > 0) {
      // This means currentStock in products was not in sync with batches!
      throw new Error('Data inconsistency: Batches do not have enough stock');
    }

    // Create transaction
    await inventoryModel.createTransaction({
      outlet_id: outletId,
      product_id: productId,
      type: 'OUT',
      quantity: quantityToRemove,
      total_cost: totalCost,
      reference_type: referenceType,
      reference_id: referenceId,
      notes
    }, client);

    // Update total stock in products table
    await inventoryModel.updateProductStock(productId, outletId, Number(currentStock) - quantityToRemove, client);

    await client.query('COMMIT');
    return totalCost;
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error in inventoryService.removeStock', error);
    throw error;
  } finally {
    client.release();
  }
};

// Stock Opname
export const stockOpname = async (
  outletId: string,
  productId: string,
  physicalQuantity: number,
  notes: string
) => {
  try {
    const currentStock = Number(await inventoryModel.getProductStock(productId, outletId));
    
    if (physicalQuantity === currentStock) {
      return { message: 'Stock is already balanced. No adjustment needed.' };
    }

    // Get accounts needed for journal
    const inventoryAccount = await findByCodeAndOutletId('1200', outletId);
    const revenueAccount = await findByCodeAndOutletId('4100', outletId);
    const expenseAccount = await findByCodeAndOutletId('6100', outletId);

    if (!inventoryAccount || !revenueAccount || !expenseAccount) {
      throw new Error('Default accounting accounts for inventory (1200, 4100, 6100) are missing');
    }

    const journalNumber = `OPN-${Date.now()}`;
    const date = new Date().toISOString().split('T')[0];

    if (physicalQuantity > currentStock) {
      // SURPLUS (add stock)
      const diff = physicalQuantity - currentStock;
      
      // What cost to use for surplus? 
      // Typically use the latest unit cost available, or 0 if none.
      const batches = await inventoryModel.getBatchesByProductId(outletId, productId);
      const lastBatch = batches.length > 0 ? batches[batches.length - 1] : null;
      const unitCost = lastBatch ? Number(lastBatch.unit_cost) : 0;
      const totalCost = diff * unitCost;

      // Add stock
      await addStock(outletId, productId, diff, unitCost, 'OPNAME', journalNumber, notes);

      // Create journal
      if (totalCost > 0) {
        await journalService.createJournal({
          outlet_id: outletId,
          journal_number: journalNumber,
          date,
          description: `Stock Opname Surplus: Product ${productId}`,
          items: [
            { account_id: inventoryAccount.id, debit: totalCost, credit: 0, description: 'Penyesuaian stok lebih' },
            { account_id: revenueAccount.id, debit: 0, credit: totalCost, description: 'Pendapatan penyesuaian stok' }
          ]
        });
      }
      return { message: `Surplus adjusted: +${diff} items` };

    } else {
      // DEFICIT (remove stock)
      const diff = currentStock - physicalQuantity;

      // Remove stock via FIFO
      const totalCost = await removeStock(outletId, productId, diff, 'OPNAME', journalNumber, notes);

      // Create journal
      if (totalCost > 0) {
        await journalService.createJournal({
          outlet_id: outletId,
          journal_number: journalNumber,
          date,
          description: `Stock Opname Deficit: Product ${productId}`,
          items: [
            { account_id: expenseAccount.id, debit: totalCost, credit: 0, description: 'Kerugian penyesuaian stok' },
            { account_id: inventoryAccount.id, debit: 0, credit: totalCost, description: 'Penyesuaian stok kurang' }
          ]
        });
      }
      return { message: `Deficit adjusted: -${diff} items` };
    }
  } catch (error) {
    logger.error('Error in inventoryService.stockOpname', error);
    throw error;
  }
};
