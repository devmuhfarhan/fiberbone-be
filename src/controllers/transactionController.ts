import { Request, Response } from 'express';
import * as transactionService from '../services/transactionService';
import { formatSuccess, formatError } from '../utils/responseFormatter';
import logger from '../utils/logger';

export const createTransfer = async (req: Request, res: Response) => {
  try {
    const outletId = (req as any).user?.outlet_id;
    if (!outletId) return res.status(400).json(formatError('Outlet ID is required'));

    const { from_account_id, to_account_id, amount, date, description, journal_number } = req.body;
    if (!from_account_id || !to_account_id || amount === undefined || !date || !journal_number) {
      return res.status(400).json(formatError('Missing required fields'));
    }

    const journal = await transactionService.createTransfer(
      outletId, from_account_id, to_account_id, amount, date, description || '', journal_number
    );
    return res.status(201).json(formatSuccess(journal));
  } catch (error: any) {
    logger.error('transactionController.createTransfer error:', error);
    return res.status(400).json(formatError(error.message));
  }
};

export const createExpense = async (req: Request, res: Response) => {
  try {
    const outletId = (req as any).user?.outlet_id;
    if (!outletId) return res.status(400).json(formatError('Outlet ID is required'));

    const { expense_account_id, payment_account_id, amount, date, description, journal_number } = req.body;
    if (!expense_account_id || !payment_account_id || amount === undefined || !date || !journal_number) {
      return res.status(400).json(formatError('Missing required fields'));
    }

    const journal = await transactionService.createExpense(
      outletId, expense_account_id, payment_account_id, amount, date, description || '', journal_number
    );
    return res.status(201).json(formatSuccess(journal));
  } catch (error: any) {
    logger.error('transactionController.createExpense error:', error);
    return res.status(400).json(formatError(error.message));
  }
};

export const createIncome = async (req: Request, res: Response) => {
  try {
    const outletId = (req as any).user?.outlet_id;
    if (!outletId) return res.status(400).json(formatError('Outlet ID is required'));

    const { income_account_id, deposit_account_id, amount, date, description, journal_number } = req.body;
    if (!income_account_id || !deposit_account_id || amount === undefined || !date || !journal_number) {
      return res.status(400).json(formatError('Missing required fields'));
    }

    const journal = await transactionService.createIncome(
      outletId, income_account_id, deposit_account_id, amount, date, description || '', journal_number
    );
    return res.status(201).json(formatSuccess(journal));
  } catch (error: any) {
    logger.error('transactionController.createIncome error:', error);
    return res.status(400).json(formatError(error.message));
  }
};

export const createPayable = async (req: Request, res: Response) => {
  try {
    const outletId = (req as any).user?.outlet_id;
    if (!outletId) return res.status(400).json(formatError('Outlet ID is required'));

    const { payable_account_id, target_account_id, amount, date, description, journal_number, vendor_id } = req.body;
    if (!payable_account_id || !target_account_id || amount === undefined || !date || !journal_number || !vendor_id) {
      return res.status(400).json(formatError('Missing required fields'));
    }

    const journal = await transactionService.createPayable(
      outletId, payable_account_id, target_account_id, amount, date, description || '', journal_number, vendor_id
    );
    return res.status(201).json(formatSuccess(journal));
  } catch (error: any) {
    logger.error('transactionController.createPayable error:', error);
    return res.status(400).json(formatError(error.message));
  }
};
