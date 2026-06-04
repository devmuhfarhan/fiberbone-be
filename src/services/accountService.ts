import * as accountModel from '../models/accountModel';
import logger from '../utils/logger';

export const getAccounts = async (outletId: string) => {
  try {
    return await accountModel.findAllByOutletId(outletId);
  } catch (error) {
    logger.error('Error in accountService.getAccounts', error);
    throw error;
  }
};

export const createAccount = async (data: accountModel.CreateAccountData) => {
  try {
    const existing = await accountModel.findByCodeAndOutletId(data.code, data.outlet_id);
    if (existing) {
      throw new Error(`Account with code ${data.code} already exists in this outlet`);
    }
    return await accountModel.createAccount(data);
  } catch (error) {
    logger.error('Error in accountService.createAccount', error);
    throw error;
  }
};

export const updateAccount = async (id: string, outletId: string, data: accountModel.UpdateAccountData) => {
  try {
    if (data.code) {
      const existing = await accountModel.findByCodeAndOutletId(data.code, outletId);
      if (existing && existing.id !== id) {
        throw new Error(`Account with code ${data.code} already exists`);
      }
    }
    const updated = await accountModel.updateAccount(id, outletId, data);
    if (!updated) throw new Error('Account not found');
    return updated;
  } catch (error) {
    logger.error('Error in accountService.updateAccount', error);
    throw error;
  }
};

export const deleteAccount = async (id: string, outletId: string) => {
  try {
    // Might fail if account is used in journal_items due to RESTRICT FK
    const deleted = await accountModel.deleteAccount(id, outletId);
    if (!deleted) throw new Error('Account not found');
    return true;
  } catch (error: any) {
    logger.error('Error in accountService.deleteAccount', error);
    if (error.code === '23503') { // Foreign key violation
      throw new Error('Account cannot be deleted because it is used in one or more journal entries');
    }
    throw error;
  }
};

export const getBalanceSheet = async (outletId: string) => {
  try {
    return await accountModel.getBalanceSheet(outletId);
  } catch (error) {
    logger.error('Error in accountService.getBalanceSheet', error);
    throw error;
  }
};
