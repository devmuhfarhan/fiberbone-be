import * as productModel from '../models/productModel';
import logger from '../utils/logger';

export const getProducts = async (
  outletId: string,
  page: number,
  limit: number,
  search?: string
) => {
  try {
    const offset = (page - 1) * limit;
    const { products, total } = await productModel.findAllByOutlet(outletId, limit, offset, search);
    const totalPage = Math.ceil(total / limit);
    return { products, total, page, limit, totalPage };
  } catch (error) {
    logger.error('Error in productService.getProducts', error);
    throw error;
  }
};

export const getProductById = async (id: string, outletId: string) => {
  try {
    const product = await productModel.findById(id, outletId);
    if (!product) throw new Error('Product not found');
    return product;
  } catch (error) {
    logger.error('Error in productService.getProductById', error);
    throw error;
  }
};

export const createProduct = async (
  outletId: string,
  data: {
    category_id?: string | null;
    unit_id?: string | null;
    name: string;
    description?: string | null;
    price: number;
    cost_price?: number | null;
    stock?: number;
    min_stock?: number;
    image_url?: string | null;
  }
) => {
  try {
    if (!data.name?.trim()) throw new Error('Product name is required');
    if (data.price === undefined || data.price < 0) throw new Error('Valid price is required');

    return await productModel.create({
      outlet_id: outletId,
      ...data,
      name: data.name.trim(),
    });
  } catch (error) {
    logger.error('Error in productService.createProduct', error);
    throw error;
  }
};

export const updateProduct = async (
  id: string,
  outletId: string,
  data: {
    category_id?: string | null;
    unit_id?: string | null;
    name?: string;
    description?: string | null;
    price?: number;
    cost_price?: number | null;
    stock?: number;
    min_stock?: number;
    image_url?: string | null;
    is_active?: boolean;
  }
) => {
  try {
    const updated = await productModel.update(id, outletId, data);
    if (!updated) throw new Error('Product not found');
    return updated;
  } catch (error) {
    logger.error('Error in productService.updateProduct', error);
    throw error;
  }
};

export const deleteProduct = async (id: string, outletId: string) => {
  try {
    const deleted = await productModel.remove(id, outletId);
    if (!deleted) throw new Error('Product not found');
    return true;
  } catch (error) {
    logger.error('Error in productService.deleteProduct', error);
    throw error;
  }
};
