import { Request, Response } from 'express';
import * as reportService from '../services/reportService';
import { formatSuccess, formatError } from '../utils/responseFormatter';
import logger from '../utils/logger';

export const getProfitAndLoss = async (req: Request, res: Response) => {
  try {
    const outletId = (req as any).user?.outlet_id;
    if (!outletId) return res.status(400).json(formatError('Outlet ID is required'));

    const startDate = req.query.start_date as string;
    const endDate = req.query.end_date as string;
    const exportFormat = req.query.export as string;

    if (!startDate || !endDate) {
      return res.status(400).json(formatError('start_date and end_date are required'));
    }

    const report = await reportService.getProfitAndLoss(outletId, startDate, endDate);

    if (exportFormat === 'csv') {
      const csvString = reportService.generateCSV(report.details);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="profit_loss_${startDate}_${endDate}.csv"`);
      return res.status(200).send(csvString);
    }

    return res.json(formatSuccess(report));
  } catch (error: any) {
    logger.error('reportController.getProfitAndLoss error:', error);
    return res.status(500).json(formatError(error.message));
  }
};

export const getGeneralLedger = async (req: Request, res: Response) => {
  try {
    const outletId = (req as any).user?.outlet_id;
    if (!outletId) return res.status(400).json(formatError('Outlet ID is required'));

    const accountId = req.query.account_id as string;
    const startDate = req.query.start_date as string;
    const endDate = req.query.end_date as string;
    const exportFormat = req.query.export as string;

    if (!accountId || !startDate || !endDate) {
      return res.status(400).json(formatError('account_id, start_date and end_date are required'));
    }

    const report = await reportService.getGeneralLedger(outletId, accountId, startDate, endDate);

    if (exportFormat === 'csv') {
      const csvString = reportService.generateCSV(report.transactions);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="general_ledger_${accountId}_${startDate}_${endDate}.csv"`);
      return res.status(200).send(csvString);
    }

    return res.json(formatSuccess(report));
  } catch (error: any) {
    logger.error('reportController.getGeneralLedger error:', error);
    return res.status(500).json(formatError(error.message));
  }
};

export const getSalesReport = async (req: Request, res: Response) => {
  try {
    const outletId = (req as any).user?.outlet_id;
    if (!outletId) return res.status(400).json(formatError('Outlet ID is required'));

    const startDate = req.query.start_date as string;
    const endDate = req.query.end_date as string;
    const exportFormat = req.query.export as string;

    if (!startDate || !endDate) {
      return res.status(400).json(formatError('start_date and end_date are required'));
    }

    const report = await reportService.getSalesReport(outletId, startDate, endDate);

    if (exportFormat === 'csv') {
      const csvString = reportService.generateCSV(report);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="sales_report_${startDate}_${endDate}.csv"`);
      return res.status(200).send(csvString);
    }

    return res.json(formatSuccess(report));
  } catch (error: any) {
    logger.error('reportController.getSalesReport error:', error);
    return res.status(500).json(formatError(error.message));
  }
};

export const getReceivablesReport = async (req: Request, res: Response) => {
  try {
    const outletId = (req as any).user?.outlet_id;
    if (!outletId) return res.status(400).json(formatError('Outlet ID is required'));

    const exportFormat = req.query.export as string;

    const report = await reportService.getReceivablesReport(outletId);

    if (exportFormat === 'csv') {
      const csvString = reportService.generateCSV(report);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="receivables_report.csv"`);
      return res.status(200).send(csvString);
    }

    return res.json(formatSuccess(report));
  } catch (error: any) {
    logger.error('reportController.getReceivablesReport error:', error);
    return res.status(500).json(formatError(error.message));
  }
};

export const getPayablesReport = async (req: Request, res: Response) => {
  try {
    const outletId = (req as any).user?.outlet_id;
    if (!outletId) return res.status(400).json(formatError('Outlet ID is required'));

    const exportFormat = req.query.export as string;

    const report = await reportService.getPayablesReport(outletId);

    if (exportFormat === 'csv') {
      const csvString = reportService.generateCSV(report);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="payables_report.csv"`);
      return res.status(200).send(csvString);
    }

    return res.json(formatSuccess(report));
  } catch (error: any) {
    logger.error('reportController.getPayablesReport error:', error);
    return res.status(500).json(formatError(error.message));
  }
};

export const getStockAdjustmentReport = async (req: Request, res: Response) => {
  try {
    const outletId = (req as any).user?.outlet_id;
    if (!outletId) return res.status(400).json(formatError('Outlet ID is required'));

    const startDate = req.query.start_date as string;
    const endDate = req.query.end_date as string;
    const exportFormat = req.query.export as string;

    if (!startDate || !endDate) {
      return res.status(400).json(formatError('start_date and end_date are required'));
    }

    const report = await reportService.getStockAdjustmentReport(outletId, startDate, endDate);

    if (exportFormat === 'csv') {
      const csvString = reportService.generateCSV(report);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="stock_adjustments_${startDate}_${endDate}.csv"`);
      return res.status(200).send(csvString);
    }

    return res.json(formatSuccess(report));
  } catch (error: any) {
    logger.error('reportController.getStockAdjustmentReport error:', error);
    return res.status(500).json(formatError(error.message));
  }
};
