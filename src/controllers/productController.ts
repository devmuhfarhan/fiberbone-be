import { Response } from 'express';
import path from 'path';
import fs from 'fs';
import { AuthRequest } from '../middlewares/authMiddleware';
import * as productService from '../services/productService';
import { formatSuccess, formatError } from '../utils/responseFormatter';
import logger from '../utils/logger';

// GET /api/products
export const getProducts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const outletId = req.user!.outlet_id;
    if (!outletId) { res.status(400).json(formatError('No active outlet selected')); return; }

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const search = req.query.search as string | undefined;

    const result = await productService.getProducts(outletId, page, limit, search);
    res.status(200).json(formatSuccess(result.products, {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPage: result.totalPage,
    }));
  } catch (error: unknown) {
    logger.error('productController.getProducts', error);
    res.status(500).json(formatError(error instanceof Error ? error.message : 'Server error'));
  }
};

// GET /api/products/:id
export const getProductById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const outletId = req.user!.outlet_id;
    if (!outletId) { res.status(400).json(formatError('No active outlet selected')); return; }

    const product = await productService.getProductById(req.params.id as string, outletId);
    res.status(200).json(formatSuccess(product));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    logger.error('productController.getProductById', error);
    res.status(message === 'Product not found' ? 404 : 500).json(formatError(message));
  }
};

// POST /api/products
export const createProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const outletId = req.user!.outlet_id;
    if (!outletId) { res.status(400).json(formatError('No active outlet selected')); return; }

    const {
      category_id, unit_id, name, description,
      price, cost_price, stock, min_stock, image_url,
    } = req.body as {
      category_id?: string;
      unit_id?: string;
      name: string;
      description?: string;
      price: number;
      cost_price?: number;
      stock?: number;
      min_stock?: number;
      image_url?: string;
    };

    const product = await productService.createProduct(outletId, {
      category_id, unit_id, name, description,
      price, cost_price, stock, min_stock, image_url,
    });
    res.status(201).json(formatSuccess(product));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    logger.error('productController.createProduct', error);
    res.status(message.includes('required') || message.includes('price') ? 400 : 500).json(formatError(message));
  }
};

// PUT /api/products/:id
export const updateProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const outletId = req.user!.outlet_id;
    if (!outletId) { res.status(400).json(formatError('No active outlet selected')); return; }

    const product = await productService.updateProduct(req.params.id as string, outletId, req.body as Parameters<typeof productService.updateProduct>[2]);
    res.status(200).json(formatSuccess(product));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    logger.error('productController.updateProduct', error);
    res.status(message === 'Product not found' ? 404 : 400).json(formatError(message));
  }
};

// DELETE /api/products/:id
export const deleteProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const outletId = req.user!.outlet_id;
    if (!outletId) { res.status(400).json(formatError('No active outlet selected')); return; }

    await productService.deleteProduct(req.params.id as string, outletId);
    res.status(200).json(formatSuccess(null));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    logger.error('productController.deleteProduct', error);
    res.status(message === 'Product not found' ? 404 : 500).json(formatError(message));
  }
};

// POST /api/products/upload-image
export const uploadProductImage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json(formatError('Tidak ada file yang diunggah'));
      return;
    }

    const imageUrl = `/storages/products/${req.file.filename}`;
    res.status(201).json(formatSuccess({ image_url: imageUrl }));
  } catch (error: unknown) {
    logger.error('productController.uploadProductImage', error);
    // Hapus file jika terjadi error
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json(formatError(error instanceof Error ? error.message : 'Upload gagal'));
  }
};
