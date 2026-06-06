import * as productService from '../services/productService';
import * as productModel from '../models/productModel';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

jest.mock('../models/productModel');

describe('Product Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getProducts', () => {
    it('should return products and pagination info', async () => {
      const mockProducts = [{ id: '1', name: 'Product 1' }];
      (productModel.findAllByOutlet as any).mockResolvedValue({ products: mockProducts, total: 1 });

      const result = await productService.getProducts('outlet1', 1, 10, 'search');

      expect(productModel.findAllByOutlet).toHaveBeenCalledWith('outlet1', 10, 0, 'search');
      expect(result).toEqual({
        products: mockProducts,
        total: 1,
        page: 1,
        limit: 10,
        totalPage: 1
      });
    });
  });

  describe('getProductById', () => {
    it('should return product by id', async () => {
      const mockProduct = { id: '1', name: 'Product 1' };
      (productModel.findById as any).mockResolvedValue(mockProduct);

      const result = await productService.getProductById('1', 'outlet1');

      expect(productModel.findById).toHaveBeenCalledWith('1', 'outlet1');
      expect(result).toEqual(mockProduct);
    });

    it('should throw an error if product not found', async () => {
      (productModel.findById as any).mockResolvedValue(null);

      await expect(productService.getProductById('1', 'outlet1')).rejects.toThrow('Product not found');
    });
  });

  describe('createProduct', () => {
    const mockData = { name: 'Product 1', price: 100 };

    it('should create product', async () => {
      const mockCreatedProduct = { id: '1', outlet_id: 'outlet1', ...mockData };
      (productModel.create as any).mockResolvedValue(mockCreatedProduct);

      const result = await productService.createProduct('outlet1', mockData);

      expect(productModel.create).toHaveBeenCalledWith({ outlet_id: 'outlet1', ...mockData, name: 'Product 1' });
      expect(result).toEqual(mockCreatedProduct);
    });

    it('should throw error if name is empty', async () => {
      await expect(productService.createProduct('outlet1', { name: '', price: 100 })).rejects.toThrow('Product name is required');
    });

    it('should throw error if price is invalid', async () => {
      await expect(productService.createProduct('outlet1', { name: 'P1', price: -10 })).rejects.toThrow('Valid price is required');
    });
  });

  describe('updateProduct', () => {
    it('should update product', async () => {
      const mockUpdatedProduct = { id: '1', name: 'Updated' };
      (productModel.update as any).mockResolvedValue(mockUpdatedProduct);

      const result = await productService.updateProduct('1', 'outlet1', { name: 'Updated' });

      expect(productModel.update).toHaveBeenCalledWith('1', 'outlet1', { name: 'Updated' });
      expect(result).toEqual(mockUpdatedProduct);
    });

    it('should throw error if product not found on update', async () => {
      (productModel.update as any).mockResolvedValue(null);

      await expect(productService.updateProduct('1', 'outlet1', { name: 'Updated' })).rejects.toThrow('Product not found');
    });
  });

  describe('deleteProduct', () => {
    it('should delete product', async () => {
      (productModel.remove as any).mockResolvedValue(true);

      const result = await productService.deleteProduct('1', 'outlet1');

      expect(productModel.remove).toHaveBeenCalledWith('1', 'outlet1');
      expect(result).toBe(true);
    });

    it('should throw error if product not found on delete', async () => {
      (productModel.remove as any).mockResolvedValue(false);

      await expect(productService.deleteProduct('1', 'outlet1')).rejects.toThrow('Product not found');
    });
  });
});
