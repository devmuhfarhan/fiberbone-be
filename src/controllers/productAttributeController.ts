import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import * as productAttributeService from '../services/productAttributeService';
import { formatSuccess, formatError } from '../utils/responseFormatter';
import logger from '../utils/logger';

// ─── KATEGORI ────────────────────────────────────────────────────────────────

// GET /api/product-attributes/categories
export const getCategories = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const outletId = req.user!.outlet_id;
    if (!outletId) { res.status(400).json(formatError('No active outlet selected')); return; }

    const data = await productAttributeService.getCategories(outletId);
    res.status(200).json(formatSuccess(data));
  } catch (error: unknown) {
    logger.error('productAttributeController.getCategories', error);
    res.status(500).json(formatError(error instanceof Error ? error.message : 'Server error'));
  }
};

// POST /api/product-attributes/categories
export const createCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const outletId = req.user!.outlet_id;
    if (!outletId) { res.status(400).json(formatError('No active outlet selected')); return; }

    const { name } = req.body;
    const data = await productAttributeService.createCategory(outletId, name as string);
    res.status(201).json(formatSuccess(data));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    logger.error('productAttributeController.createCategory', error);
    res.status(message.includes('required') ? 400 : 500).json(formatError(message));
  }
};

// PUT /api/product-attributes/categories/:id
export const updateCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const outletId = req.user!.outlet_id;
    if (!outletId) { res.status(400).json(formatError('No active outlet selected')); return; }

    const { name } = req.body;
    const data = await productAttributeService.updateCategory(req.params.id as string, outletId, name as string);
    res.status(200).json(formatSuccess(data));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    logger.error('productAttributeController.updateCategory', error);
    res.status(message === 'Category not found' ? 404 : 400).json(formatError(message));
  }
};

// DELETE /api/product-attributes/categories/:id
export const deleteCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const outletId = req.user!.outlet_id;
    if (!outletId) { res.status(400).json(formatError('No active outlet selected')); return; }

    await productAttributeService.deleteCategory(req.params.id as string, outletId);
    res.status(200).json(formatSuccess(null));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    logger.error('productAttributeController.deleteCategory', error);
    res.status(message === 'Category not found' ? 404 : 500).json(formatError(message));
  }
};

// ─── SATUAN ──────────────────────────────────────────────────────────────────

// GET /api/product-attributes/units
export const getUnits = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const outletId = req.user!.outlet_id;
    if (!outletId) { res.status(400).json(formatError('No active outlet selected')); return; }

    const data = await productAttributeService.getUnits(outletId);
    res.status(200).json(formatSuccess(data));
  } catch (error: unknown) {
    logger.error('productAttributeController.getUnits', error);
    res.status(500).json(formatError(error instanceof Error ? error.message : 'Server error'));
  }
};

// POST /api/product-attributes/units
export const createUnit = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const outletId = req.user!.outlet_id;
    if (!outletId) { res.status(400).json(formatError('No active outlet selected')); return; }

    const { name, abbreviation } = req.body as { name: string; abbreviation?: string };
    const data = await productAttributeService.createUnit(outletId, { name, abbreviation });
    res.status(201).json(formatSuccess(data));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    logger.error('productAttributeController.createUnit', error);
    res.status(message.includes('required') ? 400 : 500).json(formatError(message));
  }
};

// PUT /api/product-attributes/units/:id
export const updateUnit = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const outletId = req.user!.outlet_id;
    if (!outletId) { res.status(400).json(formatError('No active outlet selected')); return; }

    const { name, abbreviation } = req.body as { name?: string; abbreviation?: string };
    const data = await productAttributeService.updateUnit(req.params.id as string, outletId, { name, abbreviation });
    res.status(200).json(formatSuccess(data));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    logger.error('productAttributeController.updateUnit', error);
    res.status(message === 'Unit not found' ? 404 : 400).json(formatError(message));
  }
};

// DELETE /api/product-attributes/units/:id
export const deleteUnit = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const outletId = req.user!.outlet_id;
    if (!outletId) { res.status(400).json(formatError('No active outlet selected')); return; }

    await productAttributeService.deleteUnit(req.params.id as string, outletId);
    res.status(200).json(formatSuccess(null));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    logger.error('productAttributeController.deleteUnit', error);
    res.status(message === 'Unit not found' ? 404 : 500).json(formatError(message));
  }
};
