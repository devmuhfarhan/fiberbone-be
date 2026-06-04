import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import app from '../index';
import * as vendorService from '../services/vendorService';
import jwt from 'jsonwebtoken';

jest.mock('../services/vendorService');
jest.mock('jsonwebtoken');
jest.mock('../models/outletUserModel', () => ({
  findOutletByUser: jest.fn(() => Promise.resolve({ outlet_id: 'outlet-1' })),
}));
jest.mock('../models/rolePermissionModel', () => ({
  checkPermission: jest.fn((role: string, _module: string, _action: string) =>
    Promise.resolve(true) // allow all for simplicity in test
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

const mockVendorService = vendorService as jest.Mocked<typeof vendorService>;
const mockJwt = jwt as jest.Mocked<typeof jwt>;

describe('Vendors API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockJwt.verify.mockReturnValue({ id: 'uuid-1', role: 'operational' } as any);
  });

  describe('GET /api/vendors', () => {
    it('should return vendors successfully', async () => {
      mockVendorService.getVendors.mockResolvedValue([
        { id: 'v1', outlet_id: 'outlet-1', name: 'Vendor A', phone: '', created_at: new Date(), updated_at: new Date() }
      ]);

      const res = await request(app)
        .get('/api/vendors')
        .set('Cookie', ['accessToken=valid-token']);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
    });

    it('should handle internal errors gracefully', async () => {
      mockVendorService.getVendors.mockRejectedValue(new Error('DB connection failed'));
      const res = await request(app)
        .get('/api/vendors')
        .set('Cookie', ['accessToken=valid-token']);
      expect(res.status).toBe(500);
      expect(res.body.error).toBe('DB connection failed');
    });
  });

  describe('POST /api/vendors', () => {
    it('should create vendor successfully', async () => {
      mockVendorService.createVendor.mockResolvedValue({
        id: 'v2', outlet_id: 'outlet-1', name: 'Vendor B', phone: '123', created_at: new Date(), updated_at: new Date()
      });

      const res = await request(app)
        .post('/api/vendors')
        .set('Cookie', ['accessToken=valid-token'])
        .send({ name: 'Vendor B', phone: '123' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('should return 400 for missing name', async () => {
      const res = await request(app)
        .post('/api/vendors')
        .set('Cookie', ['accessToken=valid-token'])
        .send({ phone: '123' }); // missing name

      if (res.status === 403) console.log('403 Body:', res.body);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Name is required');
    });
  });

  describe('DELETE /api/vendors/:id', () => {
    it('should delete vendor successfully', async () => {
      mockVendorService.deleteVendor.mockResolvedValue(true);

      const res = await request(app)
        .delete('/api/vendors/v1')
        .set('Cookie', ['accessToken=valid-token']);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 400 when trying to delete vendor with payable balance', async () => {
      mockVendorService.deleteVendor.mockRejectedValue(new Error('Cannot delete vendor with outstanding payable balance'));

      const res = await request(app)
        .delete('/api/vendors/v1')
        .set('Cookie', ['accessToken=valid-token']);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('payable balance');
    });
  });
});
