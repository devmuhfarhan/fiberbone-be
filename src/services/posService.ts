import pool from '../config/db';
import * as posModel from '../models/posModel';
import * as inventoryService from './inventoryService';
import * as journalService from './journalService';
import * as voucherModel from '../models/voucherModel';
import * as customerModel from '../models/customerModel';
import { findByCodeAndOutletId } from '../models/accountModel';
import logger from '../utils/logger';

export interface PosItemInput {
  product_id: string;
  quantity: number;
  unit_price: number;
}

export interface PosCheckoutInput {
  customer_id?: string;
  voucher_id?: string;
  items: PosItemInput[];
  payment_method: 'CASH' | 'TRANSFER' | 'PIUTANG' | string;
  payment_account_id?: string;
  paid_amount: number;
  notes?: string;
}

export const processSale = async (outletId: string, input: PosCheckoutInput) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (!input.items || input.items.length === 0) {
      throw new Error('No items provided for sale');
    }

    // 1. Calculate subtotal
    let subtotal = 0;
    for (const item of input.items) {
      subtotal += item.quantity * item.unit_price;
    }

    // 2. Validate voucher
    let discountAmount = 0;
    if (input.voucher_id) {
      const voucher = await voucherModel.findByIdAndOutletId(input.voucher_id, outletId);
      if (!voucher) throw new Error('Voucher not found');
      if (voucher.is_used) throw new Error('Voucher has already been used');
      if (voucher.valid_until && new Date() > new Date(voucher.valid_until)) throw new Error('Voucher is expired');
      if (voucher.customer_id && voucher.customer_id !== input.customer_id) throw new Error('Voucher is not valid for this customer');

      if (voucher.discount_type === 'PERCENTAGE') {
        discountAmount = subtotal * (Number(voucher.discount_value) / 100);
      } else {
        discountAmount = Number(voucher.discount_value);
      }
    }

    let grandTotal = subtotal - discountAmount;
    if (grandTotal < 0) grandTotal = 0;

    let status: posModel.SaleStatus = 'COMPLETED';
    let changeAmount = 0;

    if (input.payment_method === 'PIUTANG') {
      if (!input.customer_id) throw new Error('Customer is required for PIUTANG');
      status = 'PIUTANG';
      // input.paid_amount can be 0 or partial
      if (input.paid_amount >= grandTotal) {
         status = 'COMPLETED';
      }
    } else {
      if (input.paid_amount < grandTotal) {
        throw new Error('Paid amount is less than grand total');
      }
      changeAmount = input.paid_amount - grandTotal;
    }

    // 3. Create Sale record
    const invoiceNumber = await posModel.generateInvoiceNumber(outletId);
    const sale = await posModel.createSale({
      outlet_id: outletId,
      customer_id: input.customer_id,
      voucher_id: input.voucher_id,
      invoice_number: invoiceNumber,
      subtotal,
      discount_amount: discountAmount,
      grand_total: grandTotal,
      payment_method: input.payment_method,
      payment_account_id: input.payment_account_id,
      paid_amount: input.paid_amount,
      change_amount: changeAmount,
      status,
      notes: input.notes
    }, client);

    // 4. Process Items (FIFO)
    let totalHpp = 0;
    for (const item of input.items) {
      // Deduct stock using FIFO which returns the total cost (HPP) for this deduction
      const itemHpp = await inventoryService.removeStock(outletId, item.product_id, item.quantity, 'SALE', invoiceNumber, 'Penjualan kasir');
      totalHpp += itemHpp;

      await posModel.createSaleItem({
        sale_id: sale.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.quantity * item.unit_price,
        total_cost: itemHpp
      }, client);
    }

    // 5. Update Customer Receivable if PIUTANG
    let piutangAmount = 0;
    if (status === 'PIUTANG') {
      piutangAmount = grandTotal - input.paid_amount;
      if (piutangAmount > 0) {
        const customer = await customerModel.findByIdAndOutletId(input.customer_id!, outletId);
        const newBalance = Number(customer!.receivable_balance) + piutangAmount;
        await customerModel.updateCustomer(input.customer_id!, outletId, { receivable_balance: newBalance }, client);
      }
    }

    // 6. Update Voucher
    if (input.voucher_id) {
      await client.query('UPDATE vouchers SET is_used = true, updated_at = current_timestamp WHERE id = $1', [input.voucher_id]);
    }

    // 7. Accounting Journals
    const date = new Date().toISOString().split('T')[0];
    const journalItems: any[] = [];
    
    // Revenue (Credit 4000)
    const revAccount = await findByCodeAndOutletId('4000', outletId);
    if (revAccount) {
      journalItems.push({ account_id: revAccount.id, debit: 0, credit: subtotal, description: `Penjualan Kasir ${invoiceNumber}` });
    }

    // Discount (Debit 4200)
    if (discountAmount > 0) {
      const discAccount = await findByCodeAndOutletId('4200', outletId);
      if (discAccount) {
        journalItems.push({ account_id: discAccount.id, debit: discountAmount, credit: 0, description: `Potongan Penjualan ${invoiceNumber}` });
      }
    }

    // Payment (Debit Kas or Piutang)
    if (input.paid_amount > 0) {
       let kasAmount = input.paid_amount;
       if (kasAmount > grandTotal) kasAmount = grandTotal; // don't journal the change amount as revenue
       
       if (input.payment_account_id) {
         journalItems.push({ account_id: input.payment_account_id, debit: kasAmount, credit: 0, description: `Penerimaan Pembayaran ${invoiceNumber}` });
       } else {
         // fallback to default 1000
         const defaultKas = await findByCodeAndOutletId('1000', outletId);
         if (defaultKas) {
             journalItems.push({ account_id: defaultKas.id, debit: kasAmount, credit: 0, description: `Penerimaan Tunai ${invoiceNumber}` });
         }
       }
    }

    if (piutangAmount > 0) {
       const piutangAccount = await findByCodeAndOutletId('1100', outletId);
       if (piutangAccount) {
           journalItems.push({ account_id: piutangAccount.id, debit: piutangAmount, credit: 0, description: `Piutang Pelanggan ${invoiceNumber}` });
       }
    }

    // HPP & Persediaan
    if (totalHpp > 0) {
       const hppAccount = await findByCodeAndOutletId('5000', outletId);
       const invAccount = await findByCodeAndOutletId('1200', outletId);
       if (hppAccount && invAccount) {
         journalItems.push({ account_id: hppAccount.id, debit: totalHpp, credit: 0, description: `HPP Penjualan ${invoiceNumber}` });
         journalItems.push({ account_id: invAccount.id, debit: 0, credit: totalHpp, description: `Pengurangan Persediaan ${invoiceNumber}` });
       }
    }

    // Create single journal for the transaction
    if (journalItems.length > 0) {
      await journalService.createJournal({
        outlet_id: outletId,
        journal_number: invoiceNumber,
        date,
        description: `Transaksi POS ${invoiceNumber}`,
        items: journalItems
      });
    }

    await client.query('COMMIT');
    return sale;
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error in posService.processSale', error);
    throw error;
  } finally {
    client.release();
  }
};
