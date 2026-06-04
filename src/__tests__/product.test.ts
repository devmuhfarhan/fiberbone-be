import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import app from '../index';
import * as productService from '../services/productService';
import jwt from 'jsonwebtoken';

jest.mock('../services/productService');
jest.mock('jsonwebtoken');
jest.mock('../models/outletUserModel', () => ({
  findOutletByUser: jest.fn(() => Promise.resolve({ outlet_id: 'outlet-1' })),
}));
jest.mock('../models/rolePermissionModel', () => ({
  checkPermission: jest.fn((role: string, _module: string, _action: string) =>
    Promise.resolve(true)
  ),
}));
jest.mock('../config/redis', () => ({
  __esModule: true,
  default: {
    get: jest.fn(async (key: string) => {
      if (key.startsWith('active_outlet:')) return 'outlet-1';
      if (key.startsWith('perm:')) return '1';
      return null;
    }),
    set: jest.fn(() => Promise.resolve('OK')),
  },
}));
jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}));

const mockProductService = productService as jest.Mocked<typeof productService>;
const mockJwt = jwt as jest.Mocked<typeof jwt>;

describe('Products API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockJwt.verify.mockReturnValue({ id: 'uuid-1', role: 'operational' } as any);
  });

  describe('GET /api/products', () => {
    it('should return products successfully', async () => {
      mockProductService.getProducts.mockResolvedValue({
        products: [
          { id: 'p1', outlet_id: 'outlet-1', name: 'Product A', price: 10000, cost_price: 5000, category_id: null, stock: 0, min_stock: 0, is_active: true, image_url: '', created_at: new Date(), updated_at: new Date() }
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPage: 1
      });

      const res = await request(app)
        .get('/api/products')
        .set('Cookie', ['accessToken=valid-token']);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
    });

    it('should handle DB errors', async () => {
      mockProductService.getProducts.mockRejectedValue(new Error('DB connection failed'));
      const res = await request(app)
        .get('/api/products')
        .set('Cookie', ['accessToken=valid-token']);
      expect(res.status).toBe(500);
    });
  });

  describe('POST /api/products', () => {
    it('should return 400 for missing fields', async () => {
      mockProductService.createProduct.mockRejectedValue(new Error('Product name is required'));
      const res = await request(app)
        .post('/api/products')
        .set('Cookie', ['accessToken=valid-token'])
        .send({ price: 10000 }); // missing name

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Product name is required');
    });

    it('should return 400 for negative price', async () => {
      mockProductService.createProduct.mockRejectedValue(new Error('Valid price is required'));
      const res = await request(app)
        .post('/api/products')
        .set('Cookie', ['accessToken=valid-token'])
        .send({ name: 'Product A', price: -5000 });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Valid price is required');
    });

    it('should create product successfully', async () => {
      mockProductService.createProduct.mockResolvedValue({
        id: 'p2', outlet_id: 'outlet-1', name: 'Product B', price: 10000, cost_price: 5000, category_id: null, stock: 0, min_stock: 0, is_active: true, image_url: '', created_at: new Date(), updated_at: new Date()
      });

      const res = await request(app)
        .post('/api/products')
        .set('Cookie', ['accessToken=valid-token'])
        .send({ name: 'Product B', price: 10000 });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });
  });
});
