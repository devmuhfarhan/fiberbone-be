import { Request, Response } from 'express';
import * as accountService from '../services/accountService';
import { formatSuccess, formatError } from '../utils/responseFormatter';
import logger from '../utils/logger';

export const getAccounts = async (req: Request, res: Response) => {
  try {
    const outletId = (req as any).user?.outlet_id;
    if (!outletId) {
      return res.status(400).json(formatError('Outlet ID is required'));
    }
    const accounts = await accountService.getAccounts(outletId);
    return res.json(formatSuccess(accounts));
  } catch (error: any) {
    logger.error('accountController.getAccounts error:', error);
    return res.status(500).json(formatError(error.message || 'Internal Server Error'));
  }
};

export const createAccount = async (req: Request, res: Response) => {
  try {
    const outletId = (req as any).user?.outlet_id;
    if (!outletId) {
      return res.status(400).json(formatError('Outlet ID is required'));
    }
    const { code, name, type, balance_type } = req.body;
    if (!code || !name || !type || !balance_type) {
      return res.status(400).json(formatError('Missing required fields'));
    }

    const account = await accountService.createAccount({
      outlet_id: outletId,
      code,
      name,
      type,
      balance_type
    });
    return res.status(201).json(formatSuccess(account));
  } catch (error: any) {
    logger.error('accountController.createAccount error:', error);
    return res.status(400).json(formatError(error.message));
  }
};

export const updateAccount = async (req: Request, res: Response) => {
  try {
    const outletId = (req as any).user?.outlet_id;
    if (!outletId) {
      return res.status(400).json(formatError('Outlet ID is required'));
    }
    const id = req.params.id as string;
    const account = await accountService.updateAccount(id, outletId, req.body);
    return res.json(formatSuccess(account));
  } catch (error: any) {
    logger.error('accountController.updateAccount error:', error);
    return res.status(400).json(formatError(error.message));
  }
};

export const deleteAccount = async (req: Request, res: Response) => {
  try {
    const outletId = (req as any).user?.outlet_id;
    if (!outletId) {
      return res.status(400).json(formatError('Outlet ID is required'));
    }
    const id = req.params.id as string;
    await accountService.deleteAccount(id, outletId);
    return res.json(formatSuccess(null));
  } catch (error: any) {
    logger.error('accountController.deleteAccount error:', error);
    return res.status(400).json(formatError(error.message));
  }
};

export const getBalanceSheet = async (req: Request, res: Response) => {
  try {
    const outletId = (req as any).user?.outlet_id;
    if (!outletId) {
      return res.status(400).json(formatError('Outlet ID is required'));
    }
    const balanceSheet = await accountService.getBalanceSheet(outletId);
    return res.json(formatSuccess(balanceSheet));
  } catch (error: any) {
    logger.error('accountController.getBalanceSheet error:', error);
    return res.status(500).json(formatError(error.message));
  }
};
