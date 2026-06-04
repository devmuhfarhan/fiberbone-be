import * as journalService from './journalService';
import { CreateJournalData } from '../models/journalModel';
import logger from '../utils/logger';

// 1. Pemindahan Saldo (Transfer)
export const createTransfer = async (
  outletId: string,
  fromAccountId: string,
  toAccountId: string,
  amount: number,
  date: string,
  description: string,
  journalNumber: string
) => {
  try {
    const journalData: CreateJournalData = {
      outlet_id: outletId,
      journal_number: journalNumber,
      date,
      description: `Transfer: ${description}`,
      items: [
        { account_id: toAccountId, debit: amount, credit: 0, description: 'Penerimaan transfer' },
        { account_id: fromAccountId, debit: 0, credit: amount, description: 'Pengiriman transfer' }
      ]
    };
    return await journalService.createJournal(journalData);
  } catch (error) {
    logger.error('Error in transactionService.createTransfer', error);
    throw error;
  }
};

// 2. Pengeluaran (Expense)
export const createExpense = async (
  outletId: string,
  expenseAccountId: string,
  paymentAccountId: string,
  amount: number,
  date: string,
  description: string,
  journalNumber: string
) => {
  try {
    const journalData: CreateJournalData = {
      outlet_id: outletId,
      journal_number: journalNumber,
      date,
      description: `Pengeluaran: ${description}`,
      items: [
        { account_id: expenseAccountId, debit: amount, credit: 0, description: 'Biaya pengeluaran' },
        { account_id: paymentAccountId, debit: 0, credit: amount, description: 'Pembayaran biaya' }
      ]
    };
    return await journalService.createJournal(journalData);
  } catch (error) {
    logger.error('Error in transactionService.createExpense', error);
    throw error;
  }
};

// 3. Pemasukan (Income)
export const createIncome = async (
  outletId: string,
  incomeAccountId: string,
  depositAccountId: string,
  amount: number,
  date: string,
  description: string,
  journalNumber: string
) => {
  try {
    const journalData: CreateJournalData = {
      outlet_id: outletId,
      journal_number: journalNumber,
      date,
      description: `Pemasukan: ${description}`,
      items: [
        { account_id: depositAccountId, debit: amount, credit: 0, description: 'Penerimaan dana' },
        { account_id: incomeAccountId, debit: 0, credit: amount, description: 'Pendapatan' }
      ]
    };
    return await journalService.createJournal(journalData);
  } catch (error) {
    logger.error('Error in transactionService.createIncome', error);
    throw error;
  }
};

// 4. Hutang Usaha (Payable)
export const createPayable = async (
  outletId: string,
  payableAccountId: string,
  targetAccountId: string,
  amount: number,
  date: string,
  description: string,
  journalNumber: string,
  vendorId: string
) => {
  try {
    const journalData: CreateJournalData = {
      outlet_id: outletId,
      journal_number: journalNumber,
      date,
      description: `Hutang Usaha: ${description}`,
      reference: `VENDOR_ID:${vendorId}`, // Use reference to store vendor ID
      items: [
        { account_id: targetAccountId, debit: amount, credit: 0, description: 'Penambahan persediaan/biaya dari hutang' },
        { account_id: payableAccountId, debit: 0, credit: amount, description: 'Pencatatan hutang usaha' }
      ]
    };
    return await journalService.createJournal(journalData);
  } catch (error) {
    logger.error('Error in transactionService.createPayable', error);
    throw error;
  }
};
