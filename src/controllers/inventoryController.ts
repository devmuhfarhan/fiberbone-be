import { Request, Response } from 'express';
import * as inventoryService from '../services/inventoryService';
import * as inventoryModel from '../models/inventoryModel';
import { formatSuccess, formatError } from '../utils/responseFormatter';
import logger from '../utils/logger';

export const getBatches = async (req: Request, res: Response) => {
  try {
    const outletId = (req as any).user?.outlet_id;
    if (!outletId) return res.status(400).json(formatError('Outlet ID is required'));

    const productId = req.params.product_id as string;
    const batches = await inventoryModel.getBatchesByProductId(outletId, productId);
    return res.json(formatSuccess(batches));
  } catch (error: any) {
    logger.error('inventoryController.getBatches error:', error);
    return res.status(500).json(formatError(error.message));
  }
};

export const getTransactions = async (req: Request, res: Response) => {
  try {
    const outletId = (req as any).user?.outlet_id;
    if (!outletId) return res.status(400).json(formatError('Outlet ID is required'));

    const productId = req.params.product_id as string;
    const transactions = await inventoryModel.getTransactionsByProductId(outletId, productId);
    return res.json(formatSuccess(transactions));
  } catch (error: any) {
    logger.error('inventoryController.getTransactions error:', error);
    return res.status(500).json(formatError(error.message));
  }
};

export const stockOpname = async (req: Request, res: Response) => {
  try {
    const outletId = (req as any).user?.outlet_id;
    if (!outletId) return res.status(400).json(formatError('Outlet ID is required'));

    const { product_id, physical_quantity, notes } = req.body;
    
    if (!product_id || physical_quantity === undefined) {
      return res.status(400).json(formatError('product_id and physical_quantity are required'));
    }

    const result = await inventoryService.stockOpname(outletId, product_id, Number(physical_quantity), notes || '');
    return res.json(formatSuccess(result));
  } catch (error: any) {
    logger.error('inventoryController.stockOpname error:', error);
    return res.status(400).json(formatError(error.message));
  }
};
