import * as journalModel from '../models/journalModel';
import * as accountModel from '../models/accountModel';
import logger from '../utils/logger';

export const getJournals = async (outletId: string) => {
  try {
    return await journalModel.findAllByOutletId(outletId);
  } catch (error) {
    logger.error('Error in journalService.getJournals', error);
    throw error;
  }
};

export const getJournalById = async (id: string, outletId: string) => {
  try {
    const journal = await journalModel.findByIdAndOutletId(id, outletId);
    if (!journal) throw new Error('Jurnal tidak ditemukan');
    return journal;
  } catch (error) {
    logger.error('Error in journalService.getJournalById', error);
    throw error;
  }
};

export const createJournal = async (data: journalModel.CreateJournalData, externalClient?: any) => {
  try {
    if (!data.items || data.items.length < 2) {
      throw new Error('Jurnal harus memiliki minimal 2 item');
    }

    let totalDebit = 0;
    let totalCredit = 0;

    for (const item of data.items) {
      const account = await accountModel.findByIdAndOutletId(item.account_id, data.outlet_id);
      if (!account) {
        throw new Error(`Akun dengan ID ${item.account_id} tidak ditemukan di outlet ini`);
      }
      
      const debit = Number(item.debit) || 0;
      const credit = Number(item.credit) || 0;
      
      if (debit < 0 || credit < 0) {
        throw new Error('Debit and credit cannot be negative');
      }
      if (debit === 0 && credit === 0) {
        throw new Error('Each item must have a debit or credit value greater than 0');
      }
      if (debit > 0 && credit > 0) {
        throw new Error('An item cannot have both debit and credit greater than 0');
      }

      totalDebit += debit;
      totalCredit += credit;
    }

    // Round to 2 decimal places to avoid float precision issues
    totalDebit = Math.round(totalDebit * 100) / 100;
    totalCredit = Math.round(totalCredit * 100) / 100;

    if (totalDebit !== totalCredit) {
      throw new Error(`Journal is not balanced. Total Debit: ${totalDebit}, Total Credit: ${totalCredit}`);
    }

    return await journalModel.createJournal(data, externalClient);
  } catch (error) {
    logger.error('Error in journalService.createJournal', error);
    throw error;
  }
};
