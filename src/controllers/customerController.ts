import { Request, Response } from 'express';
import * as customerModel from '../models/customerModel';
import * as customerService from '../services/customerService';
import { formatSuccess, formatError } from '../utils/responseFormatter';
import logger from '../utils/logger';

export const getCustomers = async (req: Request, res: Response) => {
  try {
    const outletId = (req as any).user?.outlet_id;
    if (!outletId) return res.status(400).json(formatError('Outlet ID is required'));

    const search = req.query.search as string || '';
    const customers = await customerModel.findAllByOutletId(outletId, search);
    return res.json(formatSuccess(customers));
  } catch (error: any) {
    logger.error('customerController.getCustomers error:', error);
    return res.status(500).json(formatError(error.message));
  }
};

export const getCustomerById = async (req: Request, res: Response) => {
  try {
    const outletId = (req as any).user?.outlet_id;
    if (!outletId) return res.status(400).json(formatError('Outlet ID is required'));

    const customer = await customerModel.findByIdAndOutletId(req.params.id as string, outletId);
    if (!customer) return res.status(404).json(formatError('Customer not found'));
    
    return res.json(formatSuccess(customer));
  } catch (error: any) {
    logger.error('customerController.getCustomerById error:', error);
    return res.status(500).json(formatError(error.message));
  }
};

export const createCustomer = async (req: Request, res: Response) => {
  try {
    const outletId = (req as any).user?.outlet_id;
    if (!outletId) return res.status(400).json(formatError('Outlet ID is required'));

    const { name, email, phone, address } = req.body;
    if (!name) return res.status(400).json(formatError('Name is required'));

    const customer = await customerModel.createCustomer({ outlet_id: outletId, name, email, phone, address });
    return res.status(201).json(formatSuccess(customer));
  } catch (error: any) {
    logger.error('customerController.createCustomer error:', error);
    return res.status(400).json(formatError(error.message));
  }
};

export const updateCustomer = async (req: Request, res: Response) => {
  try {
    const outletId = (req as any).user?.outlet_id;
    if (!outletId) return res.status(400).json(formatError('Outlet ID is required'));

    const customer = await customerModel.updateCustomer(req.params.id as string, outletId, req.body);
    if (!customer) return res.status(404).json(formatError('Customer not found'));

    return res.json(formatSuccess(customer));
  } catch (error: any) {
    logger.error('customerController.updateCustomer error:', error);
    return res.status(400).json(formatError(error.message));
  }
};

export const deleteCustomer = async (req: Request, res: Response) => {
  try {
    const outletId = (req as any).user?.outlet_id;
    if (!outletId) return res.status(400).json(formatError('Outlet ID is required'));

    const success = await customerModel.deleteCustomer(req.params.id as string, outletId);
    if (!success) return res.status(404).json(formatError('Customer not found'));

    return res.json({ status: 'success', data: null, message: 'Customer deleted successfully' });
  } catch (error: any) {
    logger.error('customerController.deleteCustomer error:', error);
    return res.status(400).json(formatError(error.message));
  }
};

export const payReceivable = async (req: Request, res: Response) => {
  try {
    const outletId = (req as any).user?.outlet_id;
    if (!outletId) return res.status(400).json(formatError('Outlet ID is required'));

    const { payment_account_id, amount, notes } = req.body;
    if (!payment_account_id || !amount) {
      return res.status(400).json(formatError('payment_account_id and amount are required'));
    }

    const result = await customerService.payReceivable(
      req.params.id as string,
      outletId,
      payment_account_id,
      Number(amount),
      notes
    );

    return res.json({ status: 'success', data: result, message: 'Receivable paid successfully' });
  } catch (error: any) {
    logger.error('customerController.payReceivable error:', error);
    return res.status(400).json(formatError(error.message));
  }
};
