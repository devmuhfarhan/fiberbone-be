import pool from '../config/db';
import * as purchaseModel from '../models/purchaseModel';
import * as inventoryService from './inventoryService';
import * as journalService from './journalService';
import { findByCodeAndOutletId } from '../models/accountModel';
import logger from '../utils/logger';

export const createPurchase = async (
  outletId: string,
  data: {
    vendor_id: string;
    date: string;
    payment_method: 'CASH' | 'TRANSFER' | 'HUTANG';
    payment_account_id?: string | null;
    notes?: string | null;
    created_by?: string | null;
    items: {
      product_id: string;
      quantity_ordered: number;
      unit_cost: number;
    }[];
  }
) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (!data.items || data.items.length === 0) {
      throw new Error('Purchase items are required');
    }

    // 1. Generate PO Number
    const dateStr = new Date(data.date).toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    const poNumber = `PO-${dateStr}-${rand}`;

    // 2. Calculate Total Amount
    let totalAmount = 0;
    const itemsData = data.items.map(item => {
      const lineCost = Number(item.quantity_ordered) * Number(item.unit_cost);
      totalAmount += lineCost;
      return {
        product_id: item.product_id,
        quantity_ordered: Number(item.quantity_ordered),
        unit_cost: Number(item.unit_cost)
      };
    });

    // 3. Save PO to database
    const purchase = await purchaseModel.create({
      outlet_id: outletId,
      vendor_id: data.vendor_id,
      po_number: poNumber,
      date: data.date,
      payment_method: data.payment_method,
      payment_account_id: data.payment_account_id ?? null,
      total_amount: totalAmount,
      notes: data.notes ?? null,
      created_by: data.created_by ?? null
    }, itemsData, client);

    await client.query('COMMIT');
    return purchase;
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error in purchaseService.createPurchase', error);
    throw error;
  } finally {
    client.release();
  }
};

export const receiveGoods = async (
  outletId: string,
  purchaseId: string,
  items: { product_id: string; quantity_received: number }[],
  notes?: string
) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Get PO
    const purchase = await purchaseModel.findById(purchaseId, outletId, client);
    if (!purchase) throw new Error('Purchase Order not found');

    if (purchase.status !== 'OTW') {
      throw new Error('Only OTW (in-transit) purchases can receive goods');
    }

    // 2. Get PO Items
    const purchaseItems = await purchaseModel.findItemsByPurchaseId(purchaseId, client);

    let totalReceivedValue = 0;

    // 3. Process each received item
    for (const inputItem of items) {
      const match = purchaseItems.find(pi => pi.product_id === inputItem.product_id);
      if (!match) {
        throw new Error(`Product ${inputItem.product_id} is not part of this Purchase Order`);
      }

      const currentReceived = Number(match.quantity_received);
      const ordered = Number(match.quantity_ordered);
      const newReceivedInput = Number(inputItem.quantity_received);

      if (newReceivedInput <= 0) continue;

      if (currentReceived + newReceivedInput > ordered) {
        throw new Error(`Received quantity exceeds ordered quantity for product ${match.product_name}`);
      }

      // Update quantity_received in DB
      await purchaseModel.updateItemReceivedQuantity(match.id, currentReceived + newReceivedInput, client);

      // Add to inventory stock (IN)
      await inventoryService.addStock(
        outletId,
        match.product_id,
        newReceivedInput,
        Number(match.unit_cost),
        'PURCHASE',
        purchase.po_number,
        notes || `Penerimaan PO ${purchase.po_number}`,
        client
      );

      totalReceivedValue += newReceivedInput * Number(match.unit_cost);
    }

    // 4. Create accounting journal for received goods value
    if (totalReceivedValue > 0) {
      const inventoryAccount = await findByCodeAndOutletId('1200', outletId);
      let paymentAccountId = purchase.payment_account_id;

      if (purchase.payment_method === 'HUTANG') {
        const payableAccount = await findByCodeAndOutletId('2000', outletId);
        if (!payableAccount) throw new Error('Payable account (2000) not found');
        paymentAccountId = payableAccount.id;

        // Update vendor payable balance
        await purchaseModel.updateVendorPayableBalance(purchase.vendor_id, outletId, totalReceivedValue, client);
      } else {
        // CASH or TRANSFER
        if (!paymentAccountId) {
          const kasAccount = await findByCodeAndOutletId('1000', outletId);
          if (!kasAccount) throw new Error('Default Kas account (1000) not found');
          paymentAccountId = kasAccount.id;
        }
      }

      if (!inventoryAccount || !paymentAccountId) {
        throw new Error('Default accounting accounts for PO receiving are missing');
      }

      const journalNumber = `RCV-${Date.now()}`;
      const date = new Date().toISOString().split('T')[0];

      await journalService.createJournal({
        outlet_id: outletId,
        journal_number: journalNumber,
        date,
        description: notes || `Penerimaan Barang PO: ${purchase.po_number}`,
        reference: `PURCHASE_ID:${purchase.id}`,
        items: [
          { account_id: inventoryAccount.id, debit: totalReceivedValue, credit: 0, description: `Penerimaan persediaan PO ${purchase.po_number}` },
          { account_id: paymentAccountId, debit: 0, credit: totalReceivedValue, description: `Pembayaran/Hutang persediaan PO ${purchase.po_number}` }
        ]
      }, client);
    }

    // 5. Check if PO is now fully completed
    const updatedItems = await purchaseModel.findItemsByPurchaseId(purchaseId, client);
    const allCompleted = updatedItems.every(pi => Number(pi.quantity_received) === Number(pi.quantity_ordered));

    if (allCompleted) {
      await purchaseModel.updateStatus(purchaseId, outletId, 'COMPLETED', client);
    }

    await client.query('COMMIT');
    return {
      success: true,
      message: 'Goods received successfully',
      fully_received: allCompleted
    };
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error in purchaseService.receiveGoods', error);
    throw error;
  } finally {
    client.release();
  }
};

export const getPurchases = async (
  outletId: string,
  filters: {
    status?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
    unfinishedOnly?: boolean;
  }
) => {
  return await purchaseModel.findAll(outletId, filters);
};

export const getPurchaseById = async (outletId: string, id: string) => {
  const purchase = await purchaseModel.findById(id, outletId);
  if (!purchase) return null;

  const items = await purchaseModel.findItemsByPurchaseId(id);
  return { ...purchase, items };
};

export const deletePurchase = async (outletId: string, id: string) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const purchase = await purchaseModel.findById(id, outletId, client);
    if (!purchase) throw new Error('Purchase Order not found');

    if (purchase.status !== 'OTW') {
      throw new Error('Only OTW Purchase Orders can be deleted');
    }

    const items = await purchaseModel.findItemsByPurchaseId(id, client);
    const anyReceived = items.some(pi => Number(pi.quantity_received) > 0);
    if (anyReceived) {
      throw new Error('Cannot delete Purchase Order because some items have already been received');
    }

    const success = await purchaseModel.remove(id, outletId, client);

    await client.query('COMMIT');
    return success;
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error in purchaseService.deletePurchase', error);
    throw error;
  } finally {
    client.release();
  }
};
