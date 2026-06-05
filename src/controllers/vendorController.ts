import { Request, Response } from 'express';
import * as vendorService from '../services/vendorService';
import { formatSuccess, formatError } from '../utils/responseFormatter';
import logger from '../utils/logger';

export const getVendors = async (req: Request, res: Response) => {
  try {
    const outletId = (req as any).user?.outlet_id;
    if (!outletId) {
      return res.status(400).json(formatError('Outlet ID is required'));
    }
    const search = req.query.search as string || '';
    const vendors = await vendorService.getVendors(outletId, search);
    return res.json(formatSuccess(vendors));
  } catch (error: any) {
    logger.error('vendorController.getVendors error:', error);
    return res.status(500).json(formatError(error.message || 'Internal Server Error'));
  }
};

export const getVendorById = async (req: Request, res: Response) => {
  try {
    const outletId = (req as any).user?.outlet_id;
    if (!outletId) {
      return res.status(400).json(formatError('Outlet ID is required'));
    }
    const id = req.params.id as string;
    const vendor = await vendorService.getVendorById(id, outletId);
    return res.json(formatSuccess(vendor));
  } catch (error: any) {
    logger.error('vendorController.getVendorById error:', error);
    return res.status(404).json(formatError(error.message));
  }
};

export const createVendor = async (req: Request, res: Response) => {
  try {
    const outletId = (req as any).user?.outlet_id;
    if (!outletId) {
      return res.status(400).json(formatError('Outlet ID is required'));
    }
    const { name, contact_person, phone, address } = req.body;
    if (!name) {
      return res.status(400).json(formatError('Name is required'));
    }

    const vendor = await vendorService.createVendor({
      outlet_id: outletId,
      name,
      contact_person,
      phone,
      address
    });
    return res.status(201).json(formatSuccess(vendor));
  } catch (error: any) {
    logger.error('vendorController.createVendor error:', error);
    return res.status(400).json(formatError(error.message));
  }
};

export const updateVendor = async (req: Request, res: Response) => {
  try {
    const outletId = (req as any).user?.outlet_id;
    if (!outletId) {
      return res.status(400).json(formatError('Outlet ID is required'));
    }
    const id = req.params.id as string;
    const vendor = await vendorService.updateVendor(id, outletId, req.body);
    return res.json(formatSuccess(vendor));
  } catch (error: any) {
    logger.error('vendorController.updateVendor error:', error);
    return res.status(400).json(formatError(error.message));
  }
};

export const deleteVendor = async (req: Request, res: Response) => {
  try {
    const outletId = (req as any).user?.outlet_id;
    if (!outletId) {
      return res.status(400).json(formatError('Outlet ID is required'));
    }
    const id = req.params.id as string;
    await vendorService.deleteVendor(id, outletId);
    return res.json(formatSuccess(null));
  } catch (error: any) {
    logger.error('vendorController.deleteVendor error:', error);
    return res.status(400).json(formatError(error.message));
  }
};
