import { Request, Response } from 'express';
import * as posService from '../services/posService';
import * as posModel from '../models/posModel';
import { formatSuccess, formatError } from '../utils/responseFormatter';
import logger from '../utils/logger';

export const checkout = async (req: Request, res: Response) => {
  try {
    const outletId = (req as any).user?.outlet_id;
    if (!outletId) return res.status(400).json(formatError('Outlet ID is required'));

    const sale = await posService.processSale(outletId, req.body);
    return res.status(201).json(formatSuccess(sale));
  } catch (error: any) {
    logger.error('posController.checkout error:', error);
    return res.status(400).json(formatError(error.message));
  }
};

export const getSales = async (req: Request, res: Response) => {
  try {
    const outletId = (req as any).user?.outlet_id;
    if (!outletId) return res.status(400).json(formatError('Outlet ID is required'));

    const limit = Number(req.query.limit) || 50;
    const offset = Number(req.query.offset) || 0;

    const sales = await posModel.getSalesByOutletId(outletId, limit, offset);
    return res.json(formatSuccess(sales));
  } catch (error: any) {
    logger.error('posController.getSales error:', error);
    return res.status(500).json(formatError(error.message));
  }
};

export const getSaleById = async (req: Request, res: Response) => {
  try {
    const outletId = (req as any).user?.outlet_id;
    if (!outletId) return res.status(400).json(formatError('Outlet ID is required'));

    const sale = await posModel.getSaleByIdAndOutletId(req.params.id as string, outletId);
    if (!sale) return res.status(404).json(formatError('Sale not found'));

    const items = await posModel.getSaleItemsBySaleId(sale.id);
    
    return res.json(formatSuccess({ ...sale, items }));
  } catch (error: any) {
    logger.error('posController.getSaleById error:', error);
    return res.status(500).json(formatError(error.message));
  }
};
