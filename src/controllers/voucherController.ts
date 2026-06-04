import { Request, Response } from 'express';
import * as voucherModel from '../models/voucherModel';
import { formatSuccess, formatError } from '../utils/responseFormatter';
import logger from '../utils/logger';

export const getVouchers = async (req: Request, res: Response) => {
  try {
    const outletId = (req as any).user?.outlet_id;
    if (!outletId) return res.status(400).json(formatError('Outlet ID is required'));

    const vouchers = await voucherModel.findAllByOutletId(outletId);
    return res.json(formatSuccess(vouchers));
  } catch (error: any) {
    logger.error('voucherController.getVouchers error:', error);
    return res.status(500).json(formatError(error.message));
  }
};

export const getVoucherById = async (req: Request, res: Response) => {
  try {
    const outletId = (req as any).user?.outlet_id;
    if (!outletId) return res.status(400).json(formatError('Outlet ID is required'));

    const voucher = await voucherModel.findByIdAndOutletId(req.params.id as string, outletId);
    if (!voucher) return res.status(404).json(formatError('Voucher not found'));
    
    return res.json(formatSuccess(voucher));
  } catch (error: any) {
    logger.error('voucherController.getVoucherById error:', error);
    return res.status(500).json(formatError(error.message));
  }
};

export const createVoucher = async (req: Request, res: Response) => {
  try {
    const outletId = (req as any).user?.outlet_id;
    if (!outletId) return res.status(400).json(formatError('Outlet ID is required'));

    const { customer_id, code, discount_type, discount_value, valid_until } = req.body;
    if (!code || !discount_type || discount_value === undefined) {
      return res.status(400).json(formatError('Code, discount_type, and discount_value are required'));
    }

    const voucher = await voucherModel.createVoucher({ 
      outlet_id: outletId, 
      customer_id, 
      code, 
      discount_type, 
      discount_value, 
      valid_until 
    });
    return res.status(201).json(formatSuccess(voucher));
  } catch (error: any) {
    logger.error('voucherController.createVoucher error:', error);
    if (error.code === '23505') { // Unique constraint violation
      return res.status(400).json(formatError('Voucher code already exists in this outlet'));
    }
    return res.status(400).json(formatError(error.message));
  }
};

export const updateVoucher = async (req: Request, res: Response) => {
  try {
    const outletId = (req as any).user?.outlet_id;
    if (!outletId) return res.status(400).json(formatError('Outlet ID is required'));

    const voucher = await voucherModel.updateVoucher(req.params.id as string, outletId, req.body);
    if (!voucher) return res.status(404).json(formatError('Voucher not found'));

    return res.json(formatSuccess(voucher));
  } catch (error: any) {
    logger.error('voucherController.updateVoucher error:', error);
    return res.status(400).json(formatError(error.message));
  }
};

export const deleteVoucher = async (req: Request, res: Response) => {
  try {
    const outletId = (req as any).user?.outlet_id;
    if (!outletId) return res.status(400).json(formatError('Outlet ID is required'));

    const success = await voucherModel.deleteVoucher(req.params.id as string, outletId);
    if (!success) return res.status(404).json(formatError('Voucher not found'));

    return res.json({ status: 'success', data: null, message: 'Voucher deleted successfully' });
  } catch (error: any) {
    logger.error('voucherController.deleteVoucher error:', error);
    return res.status(400).json(formatError(error.message));
  }
};
