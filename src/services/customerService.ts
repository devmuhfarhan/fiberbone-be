import pool from '../config/db';
import * as customerModel from '../models/customerModel';
import * as journalService from './journalService';
import { findByCodeAndOutletId, findByIdAndOutletId as findAccountByIdAndOutletId } from '../models/accountModel';
import logger from '../utils/logger';

export const payReceivable = async (
  customerId: string,
  outletId: string,
  paymentAccountId: string,
  amount: number,
  notes?: string
) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Get customer
    const customer = await customerModel.findByIdAndOutletId(customerId, outletId);
    if (!customer) throw new Error('Pelanggan tidak ditemukan');

    if (Number(customer.receivable_balance) < amount) {
      throw new Error(`Jumlah melebihi saldo piutang. Saldo saat ini adalah ${customer.receivable_balance}`);
    }

    // 2. Get accounts
    const piutangAccount = await findByCodeAndOutletId('1100', outletId); // Piutang Usaha
    if (!piutangAccount) throw new Error('Akun 1100 (Piutang Usaha) tidak ditemukan');

    const paymentAccount = await findAccountByIdAndOutletId(paymentAccountId, outletId);
    if (!paymentAccount) throw new Error('Akun tidak ditemukan');

    // 3. Update customer balance
    const newBalance = Number(customer.receivable_balance) - amount;
    await customerModel.updateCustomer(customerId, outletId, { receivable_balance: newBalance }, client);

    // 4. Create journal
    const journalNumber = `PAY-REC-${Date.now()}`;
    const date = new Date().toISOString().split('T')[0];

    await journalService.createJournal({
      outlet_id: outletId,
      journal_number: journalNumber,
      date,
      description: notes || `Pembayaran Piutang: ${customer.name}`,
      items: [
        { account_id: paymentAccount.id, debit: amount, credit: 0, description: 'Penerimaan pembayaran' },
        { account_id: piutangAccount.id, debit: 0, credit: amount, description: 'Pengurangan piutang pelanggan' }
      ]
    });

    await client.query('COMMIT');
    return { success: true, newBalance };
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error in customerService.payReceivable', error);
    throw error;
  } finally {
    client.release();
  }
};
