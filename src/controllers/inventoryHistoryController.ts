import { Request, Response } from 'express';
import * as inventoryHistoryService from '../services/inventoryHistoryService';
import { formatSuccess, formatError } from '../utils/responseFormatter';
import logger from '../utils/logger';

export const getOpnameHistory = async (req: Request, res: Response) => {
  try {
    const outletId = (req as any).user?.outlet_id;
    if (!outletId) return res.status(400).json(formatError('Outlet ID is required'));
    
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
    
    const { rows, total } = await inventoryHistoryService.getOpnameHistory({
      outletId,
      startDate,
      endDate,
      page,
      limit,
    });
    const totalPage = Math.ceil(total / limit);
    
    return res.json(formatSuccess(rows, { page, limit, total, totalPage }));
  } catch (error: any) {
    logger.error('inventoryHistoryController.getOpnameHistory error:', error);
    return res.status(500).json(formatError(error.message));
  }
};

export const getMutationHistory = async (req: Request, res: Response) => {
  try {
    const outletId = (req as any).user?.outlet_id;
    if (!outletId) return res.status(400).json(formatError('Outlet ID is required'));
    
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
    
    const { rows, total } = await inventoryHistoryService.getMutationHistory({
      outletId,
      startDate,
      endDate,
      page,
      limit,
    });
    const totalPage = Math.ceil(total / limit);
    
    return res.json(formatSuccess(rows, { page, limit, total, totalPage }));
  } catch (error: any) {
    logger.error('inventoryHistoryController.getMutationHistory error:', error);
    return res.status(500).json(formatError(error.message));
  }
};

export const getBatchHistory = async (req: Request, res: Response) => {
  try {
    const outletId = (req as any).user?.outlet_id;
    if (!outletId) return res.status(400).json(formatError('Outlet ID is required'));
    
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
    
    const { rows, total } = await inventoryHistoryService.getBatchHistory({
      outletId,
      startDate,
      endDate,
      page,
      limit,
    });
    const totalPage = Math.ceil(total / limit);
    
    return res.json(formatSuccess(rows, { page, limit, total, totalPage }));
  } catch (error: any) {
    logger.error('inventoryHistoryController.getBatchHistory error:', error);
    return res.status(500).json(formatError(error.message));
  }
};

export const getExchangeHistory = async (req: Request, res: Response) => {
  try {
    const outletId = (req as any).user?.outlet_id;
    if (!outletId) return res.status(400).json(formatError('Outlet ID is required'));
    
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
    
    const { rows, total } = await inventoryHistoryService.getExchangeHistory({
      outletId,
      startDate,
      endDate,
      page,
      limit,
    });
    const totalPage = Math.ceil(total / limit);
    
    return res.json(formatSuccess(rows, { page, limit, total, totalPage }));
  } catch (error: any) {
    logger.error('inventoryHistoryController.getExchangeHistory error:', error);
    return res.status(500).json(formatError(error.message));
  }
};
