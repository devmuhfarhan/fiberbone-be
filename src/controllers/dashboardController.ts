import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import * as dashboardService from '../services/dashboardService';
import { formatSuccess, formatError } from '../utils/responseFormatter';
import logger from '../utils/logger';

// GET /api/dashboard
export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const outletId = req.user?.outlet_id;
    if (!outletId) {
      res.status(400).json(formatError('No active outlet selected'));
      return;
    }

    const stats = await dashboardService.getDashboardStats(outletId);
    res.status(200).json(formatSuccess(stats));
  } catch (error: unknown) {
    logger.error('dashboardController.getDashboardStats', error);
    res.status(500).json(formatError(error instanceof Error ? error.message : 'Server error'));
  }
};
