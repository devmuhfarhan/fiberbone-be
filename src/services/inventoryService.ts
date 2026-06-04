import pool from '../config/db';
import * as inventoryModel from '../models/inventoryModel';
import * as productModel from '../models/productModel';
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
  notes?: string,
  externalClient?: any
) => {
  const client = externalClient || await pool.connect();
  try {
    if (!externalClient) {
      await client.query('BEGIN');
    }

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

    if (!externalClient) {
      await client.query('COMMIT');
    }
    return true;
  } catch (error) {
    if (!externalClient) {
      await client.query('ROLLBACK');
    }
    logger.error('Error in inventoryService.addStock', error);
    throw error;
  } finally {
    if (!externalClient) {
      client.release();
    }
  }
};

// Remove stock using FIFO (OUT)
export const removeStock = async (
  outletId: string,
  productId: string,
  quantityToRemove: number,
  referenceType?: string,
  referenceId?: string,
  notes?: string,
  externalClient?: any
): Promise<number> => { // returns the total cost (HPP) of the removed stock
  const client = externalClient || await pool.connect();
  try {
    if (!externalClient) {
      await client.query('BEGIN');
    }

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

    if (!externalClient) {
      await client.query('COMMIT');
    }
    return totalCost;
  } catch (error) {
    if (!externalClient) {
      await client.query('ROLLBACK');
    }
    logger.error('Error in inventoryService.removeStock', error);
    throw error;
  } finally {
    if (!externalClient) {
      client.release();
    }
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

export interface ExchangeItemsInput {
  returned_product_id: string;
  returned_quantity: number;
  exchange_product_id: string;
  exchange_quantity: number;
  payment_account_id?: string; // The account to debit for the difference (e.g. Kas/Bank)
  notes?: string;
}

export const exchangeItems = async (outletId: string, input: ExchangeItemsInput) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Get products
    const returnedProduct = await productModel.findById(input.returned_product_id, outletId);
    if (!returnedProduct) throw new Error('Returned product not found');

    const exchangeProduct = await productModel.findById(input.exchange_product_id, outletId);
    if (!exchangeProduct) throw new Error('Exchange product not found');

    // 2. Validate price constraint: returned item must be cheaper than exchange item
    if (Number(returnedProduct.price) >= Number(exchangeProduct.price)) {
      throw new Error('Penukaran gagal: Harga barang yang dikembalikan harus lebih murah daripada barang yang ditukarkan');
    }

    const returnTotal = Number(returnedProduct.price) * input.returned_quantity;
    const exchangeTotal = Number(exchangeProduct.price) * input.exchange_quantity;
    const priceDifference = exchangeTotal - returnTotal;

    // Additionally check total value just in case
    if (priceDifference <= 0) {
      throw new Error('Penukaran gagal: Nilai total barang yang dikembalikan harus lebih kecil dari nilai total barang yang dikeluarkan');
    }

    // 3. Get accounting accounts
    const kasAccount = await findByCodeAndOutletId('1000', outletId); // Kas
    const revenueAccount = await findByCodeAndOutletId('4000', outletId); // Pendapatan Penjualan
    const inventoryAccount = await findByCodeAndOutletId('1200', outletId); // Persediaan
    const hppAccount = await findByCodeAndOutletId('5000', outletId); // HPP

    if (!inventoryAccount || !revenueAccount || !hppAccount) {
      throw new Error('Default accounting accounts (1200, 4000, 5000) are missing');
    }

    const journalNumber = `EXC-${Date.now()}`;
    const date = new Date().toISOString().split('T')[0];

    // 4. Returned Product stock IN
    const batches = await inventoryModel.getBatchesByProductId(outletId, input.returned_product_id, client);
    const returnedUnitCost = batches.length > 0 ? Number(batches[batches.length - 1].unit_cost) : (returnedProduct.cost_price || 0);
    const returnedTotalCost = returnedUnitCost * input.returned_quantity;

    await addStock(
      outletId,
      input.returned_product_id,
      input.returned_quantity,
      returnedUnitCost,
      'EXCHANGE_RETURN',
      journalNumber,
      input.notes || `Penukaran barang masuk: ${returnedProduct.name}`,
      client
    );

    // 5. Exchange Product stock OUT (FIFO)
    const exchangeTotalCost = await removeStock(
      outletId,
      input.exchange_product_id,
      input.exchange_quantity,
      'EXCHANGE_OUT',
      journalNumber,
      input.notes || `Penukaran barang keluar: ${exchangeProduct.name}`,
      client
    );

    // 6. Create Accounting Journal
    const journalItems = [
      // Revenue adjustment
      { account_id: revenueAccount.id, debit: returnTotal, credit: 0, description: `Retur Penukaran: ${returnedProduct.name}` },
      { account_id: revenueAccount.id, debit: 0, credit: exchangeTotal, description: `Penukaran Keluar: ${exchangeProduct.name}` },
      
      // Stock & HPP reversal for returned item
      { account_id: inventoryAccount.id, debit: returnedTotalCost, credit: 0, description: `Kembali ke Persediaan: ${returnedProduct.name}` },
      { account_id: hppAccount.id, debit: 0, credit: returnedTotalCost, description: `Reversal HPP Retur: ${returnedProduct.name}` },

      // Stock & HPP record for exchange item
      { account_id: hppAccount.id, debit: exchangeTotalCost, credit: 0, description: `HPP Penukaran: ${exchangeProduct.name}` },
      { account_id: inventoryAccount.id, debit: 0, credit: exchangeTotalCost, description: `Persediaan Keluar: ${exchangeProduct.name}` }
    ];

    // Debit payment account for the difference
    let debitAccountId = input.payment_account_id;
    if (!debitAccountId && kasAccount) {
      debitAccountId = kasAccount.id;
    }
    if (debitAccountId) {
      journalItems.push({
        account_id: debitAccountId,
        debit: priceDifference,
        credit: 0,
        description: `Penerimaan Selisih Penukaran`
      });
    }

    await journalService.createJournal({
      outlet_id: outletId,
      journal_number: journalNumber,
      date,
      description: input.notes || `Transaksi Penukaran Barang: ${returnedProduct.name} ke ${exchangeProduct.name}`,
      items: journalItems
    });

    await client.query('COMMIT');
    return {
      success: true,
      journal_number: journalNumber,
      return_total: returnTotal,
      exchange_total: exchangeTotal,
      difference: priceDifference
    };
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error in inventoryService.exchangeItems', error);
    throw error;
  } finally {
    client.release();
  }
};

