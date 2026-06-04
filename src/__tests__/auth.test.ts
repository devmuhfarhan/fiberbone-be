import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import app from '../index';
import * as authService from '../services/authService';

jest.mock('../services/authService');
jest.mock('../models/outletUserModel', () => ({
  findOutletByUser: jest.fn(() => Promise.resolve(null)),
}));
jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  add: jest.fn()
}));

const mockAuthService = authService as jest.Mocked<typeof authService>;

describe('Auth API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      mockAuthService.register.mockResolvedValue({
        id: 'uuid-1',
        fullname: 'Test User',
        email: 'test@example.com',
        is_active: true,
        role: 'cashier',
        created_at: new Date(),
        updated_at: new Date()
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send({ fullname: 'Test User', email: 'test@example.com', password: 'password123' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.fullname).toBe('Test User');
    });

    it('should return 400 if email already exists', async () => {
      mockAuthService.register.mockRejectedValue(new Error('Email already registered'));

      const res = await request(app)
        .post('/api/auth/register')
        .send({ fullname: 'Test User', email: 'test@example.com', password: 'password123' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Email already registered');
    });

    it('should return 400 for missing required fields', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com' }); // Missing fullname and password

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Fullname, email, and password are required');
    });

    it('should handle internal server errors gracefully', async () => {
      mockAuthService.register.mockRejectedValue(new Error('Database timeout'));

      const res = await request(app)
        .post('/api/auth/register')
        .send({ fullname: 'Test User', email: 'test@example.com', password: 'password123' });

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Database timeout');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login and return cookies', async () => {
      mockAuthService.login.mockResolvedValue({
        accessToken: 'mock-access',
        refreshToken: 'mock-refresh',
        user: { id: 'uuid-1', fullname: 'Test', email: 'test@example.com', role: 'superadmin', is_active: true }
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      
      const cookies = (res.headers['set-cookie'] as unknown as string[]) || [];
      expect(cookies).toBeDefined();
      expect(cookies.some((c: string) => c.includes('accessToken=mock-access'))).toBe(true);
      expect(cookies.some((c: string) => c.includes('refreshToken=mock-refresh'))).toBe(true);
    });

    it('should return 401 for invalid credentials', async () => {
      mockAuthService.login.mockRejectedValue(new Error('Invalid email or password'));

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'wrongpassword' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Invalid email or password');
    });

    it('should return 401 for inactive user', async () => {
      mockAuthService.login.mockRejectedValue(new Error('Account is deactivated'));

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'inactive@example.com', password: 'password123' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Account is deactivated');
    });

    it('should return 400 for missing fields', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com' }); // Missing password

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Email and password are required');
    });

    it('should handle internal server errors gracefully', async () => {
      mockAuthService.login.mockRejectedValue(new Error('Connection failed'));

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password123' });

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Connection failed');
    });
  });
});
