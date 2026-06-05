import * as categoryModel from '../models/productCategoryModel';
import * as unitModel from '../models/productUnitModel';
import logger from '../utils/logger';

// ─── KATEGORI ────────────────────────────────────────────────────────────────

export const getCategories = async (outletId: string, search: string = '') => {
  try {
    return await categoryModel.findAllByOutlet(outletId, search);
  } catch (error) {
    logger.error('Error in productAttributeService.getCategories', error);
    throw error;
  }
};

export const createCategory = async (outletId: string, name: string) => {
  try {
    if (!name?.trim()) throw new Error('Category name is required');
    return await categoryModel.create({ outlet_id: outletId, name: name.trim() });
  } catch (error) {
    logger.error('Error in productAttributeService.createCategory', error);
    throw error;
  }
};

export const updateCategory = async (id: string, outletId: string, name: string) => {
  try {
    if (!name?.trim()) throw new Error('Category name is required');
    const updated = await categoryModel.update(id, outletId, name.trim());
    if (!updated) throw new Error('Category not found');
    return updated;
  } catch (error) {
    logger.error('Error in productAttributeService.updateCategory', error);
    throw error;
  }
};

export const deleteCategory = async (id: string, outletId: string) => {
  try {
    const deleted = await categoryModel.remove(id, outletId);
    if (!deleted) throw new Error('Category not found');
    return true;
  } catch (error) {
    logger.error('Error in productAttributeService.deleteCategory', error);
    throw error;
  }
};

// ─── SATUAN ──────────────────────────────────────────────────────────────────

export const getUnits = async (outletId: string, search: string = '') => {
  try {
    return await unitModel.findAllByOutlet(outletId, search);
  } catch (error) {
    logger.error('Error in productAttributeService.getUnits', error);
    throw error;
  }
};

export const createUnit = async (
  outletId: string,
  data: { name: string; abbreviation?: string }
) => {
  try {
    if (!data.name?.trim()) throw new Error('Unit name is required');
    return await unitModel.create({
      outlet_id: outletId,
      name: data.name.trim(),
      abbreviation: data.abbreviation?.trim(),
    });
  } catch (error) {
    logger.error('Error in productAttributeService.createUnit', error);
    throw error;
  }
};

export const updateUnit = async (
  id: string,
  outletId: string,
  data: { name?: string; abbreviation?: string }
) => {
  try {
    const updated = await unitModel.update(id, outletId, data);
    if (!updated) throw new Error('Unit not found');
    return updated;
  } catch (error) {
    logger.error('Error in productAttributeService.updateUnit', error);
    throw error;
  }
};

export const deleteUnit = async (id: string, outletId: string) => {
  try {
    const deleted = await unitModel.remove(id, outletId);
    if (!deleted) throw new Error('Unit not found');
    return true;
  } catch (error) {
    logger.error('Error in productAttributeService.deleteUnit', error);
    throw error;
  }
};
