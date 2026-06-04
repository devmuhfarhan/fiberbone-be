import * as vendorModel from '../models/vendorModel';
import logger from '../utils/logger';

export const getVendors = async (outletId: string) => {
  try {
    return await vendorModel.findAllByOutletId(outletId);
  } catch (error) {
    logger.error('Error in vendorService.getVendors', error);
    throw error;
  }
};

export const getVendorById = async (id: string, outletId: string) => {
  try {
    const vendor = await vendorModel.findByIdAndOutletId(id, outletId);
    if (!vendor) throw new Error('Vendor not found');
    return vendor;
  } catch (error) {
    logger.error('Error in vendorService.getVendorById', error);
    throw error;
  }
};

export const createVendor = async (data: vendorModel.CreateVendorData) => {
  try {
    return await vendorModel.createVendor(data);
  } catch (error) {
    logger.error('Error in vendorService.createVendor', error);
    throw error;
  }
};

export const updateVendor = async (id: string, outletId: string, data: Partial<vendorModel.CreateVendorData>) => {
  try {
    const updated = await vendorModel.updateVendor(id, outletId, data);
    if (!updated) throw new Error('Vendor not found');
    return updated;
  } catch (error) {
    logger.error('Error in vendorService.updateVendor', error);
    throw error;
  }
};

export const deleteVendor = async (id: string, outletId: string) => {
  try {
    const deleted = await vendorModel.deleteVendor(id, outletId);
    if (!deleted) throw new Error('Vendor not found');
    return true;
  } catch (error) {
    logger.error('Error in vendorService.deleteVendor', error);
    throw error;
  }
};
