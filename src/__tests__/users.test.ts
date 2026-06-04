import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import app from '../index';
import * as userService from '../services/userService';
import jwt from 'jsonwebtoken';

jest.mock('../services/userService');
jest.mock('jsonwebtoken');
jest.mock('../models/outletUserModel', () => ({
  findOutletByUser: jest.fn(() => Promise.resolve(null)),
}));
jest.mock('../models/rolePermissionModel', () => ({
  // superadmin: izin semua; role lain: tidak punya izin ke modul 'users'
  checkPermission: jest.fn((role: string, _module: string, _action: string) =>
    Promise.resolve(role === 'superadmin')
  ),
}));
jest.mock('../config/redis', () => ({
  __esModule: true,
  default: {
    get: jest.fn(() => Promise.resolve(null)),
    set: jest.fn(() => Promise.resolve('OK')),
    del: jest.fn(() => Promise.resolve(1)),
  },
}));
jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  add: jest.fn()
}));

const mockUserService = userService as jest.Mocked<typeof userService>;
const mockJwt = jwt as jest.Mocked<typeof jwt>;

describe('Users API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/users', () => {
    it('should block unauthenticated access', async () => {
      const res = await request(app).get('/api/users');
      expect(res.status).toBe(401);
    });

    it('should allow admin access and return users', async () => {
      mockJwt.verify.mockReturnValue({ id: 'uuid-1', role: 'superadmin' } as any);
      
      mockUserService.getAllUsers.mockResolvedValue({
        users: [{ id: 'uuid-1', fullname: 'Admin', email: 'a@a.com', is_active: true, role: 'superadmin' }],
        total: 1
      });

      const res = await request(app)
        .get('/api/users')
        .set('Cookie', ['accessToken=valid-token']);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
    });

    it('should block non-admin access', async () => {
      mockJwt.verify.mockReturnValue({ id: 'uuid-2', role: 'cashier' } as any);

      const res = await request(app)
        .get('/api/users')
        .set('Cookie', ['accessToken=valid-token']);

      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/users', () => {
    it('should allow superadmin to create user', async () => {
      mockJwt.verify.mockReturnValue({ id: 'uuid-1', role: 'superadmin' } as any);
      mockUserService.createUser.mockResolvedValue({
        id: 'uuid-new',
        fullname: 'New User',
        email: 'new@example.com',
        is_active: true,
        role: 'cashier'
      });

      const res = await request(app)
        .post('/api/users')
        .set('Cookie', ['accessToken=valid-token'])
        .send({
          fullname: 'New User',
          email: 'new@example.com',
          password: 'password123',
          role: 'cashier'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(mockUserService.createUser).toHaveBeenCalled();
    });

    it('should block non-superadmin', async () => {
      mockJwt.verify.mockReturnValue({ id: 'uuid-2', role: 'operational' } as any);

      const res = await request(app)
        .post('/api/users')
        .set('Cookie', ['accessToken=valid-token'])
        .send({
          fullname: 'New User',
          email: 'new@example.com',
          password: 'password123',
          role: 'cashier'
        });

      expect(res.status).toBe(403);
    });

    it('should return 400 for missing required fields', async () => {
      mockJwt.verify.mockReturnValue({ id: 'uuid-1', role: 'superadmin' } as any);

      const res = await request(app)
        .post('/api/users')
        .set('Cookie', ['accessToken=valid-token'])
        .send({
          fullname: 'New User'
          // Missing email, password, role
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('required');
    });

    it('should return 400 if email is already in use', async () => {
      mockJwt.verify.mockReturnValue({ id: 'uuid-1', role: 'superadmin' } as any);
      mockUserService.createUser.mockRejectedValue(new Error('Email is already in use'));

      const res = await request(app)
        .post('/api/users')
        .set('Cookie', ['accessToken=valid-token'])
        .send({
          fullname: 'New User',
          email: 'new@example.com',
          password: 'password123',
          role: 'cashier'
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Email is already in use');
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should update user successfully', async () => {
      mockJwt.verify.mockReturnValue({ id: 'uuid-1', role: 'superadmin' } as any);
      mockUserService.updateUser.mockResolvedValue({
        id: 'uuid-target',
        fullname: 'Updated User',
        email: 'updated@example.com',
        is_active: true,
        role: 'cashier'
      });

      const res = await request(app)
        .put('/api/users/uuid-target')
        .set('Cookie', ['accessToken=valid-token'])
        .send({
          fullname: 'Updated User'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 400 when trying to edit another superadmin', async () => {
      mockJwt.verify.mockReturnValue({ id: 'uuid-1', role: 'superadmin' } as any);
      mockUserService.updateUser.mockRejectedValue(new Error('You cannot edit another superadmin'));

      const res = await request(app)
        .put('/api/users/uuid-target')
        .set('Cookie', ['accessToken=valid-token'])
        .send({
          fullname: 'Hacked Superadmin'
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('You cannot edit another superadmin');
    });

    it('should handle internal server errors', async () => {
      mockJwt.verify.mockReturnValue({ id: 'uuid-1', role: 'superadmin' } as any);
      mockUserService.updateUser.mockRejectedValue(new Error('Database timeout'));

      const res = await request(app)
        .put('/api/users/uuid-target')
        .set('Cookie', ['accessToken=valid-token'])
        .send({ fullname: 'Test' });

      expect(res.status).toBe(500);
    });
  });

  describe('PUT /api/users/:id/status', () => {
    it('should return 400 for missing is_active flag', async () => {
      mockJwt.verify.mockReturnValue({ id: 'uuid-1', role: 'superadmin' } as any);

      const res = await request(app)
        .put('/api/users/uuid-target/status')
        .set('Cookie', ['accessToken=valid-token'])
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('is_active is required');
    });

    it('should update status successfully', async () => {
      mockJwt.verify.mockReturnValue({ id: 'uuid-1', role: 'superadmin' } as any);
      mockUserService.updateUserStatus.mockResolvedValue({
        id: 'uuid-target',
        fullname: 'User',
        email: 'u@example.com',
        is_active: false,
        role: 'cashier'
      });

      const res = await request(app)
        .put('/api/users/uuid-target/status')
        .set('Cookie', ['accessToken=valid-token'])
        .send({ is_active: false });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 400 when trying to deactivate self', async () => {
      mockJwt.verify.mockReturnValue({ id: 'uuid-1', role: 'superadmin' } as any);
      mockUserService.updateUserStatus.mockRejectedValue(new Error('You cannot deactivate yourself'));

      const res = await request(app)
        .put('/api/users/uuid-1/status')
        .set('Cookie', ['accessToken=valid-token'])
        .send({ is_active: false });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('You cannot deactivate yourself');
    });
  });

  describe('PUT /api/users/:id/password', () => {
    it('should return 400 for short password', async () => {
      mockJwt.verify.mockReturnValue({ id: 'uuid-1', role: 'superadmin' } as any);

      const res = await request(app)
        .put('/api/users/uuid-target/password')
        .set('Cookie', ['accessToken=valid-token'])
        .send({ new_password: 'short' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('must be at least 6 characters');
    });

    it('should reset password successfully', async () => {
      mockJwt.verify.mockReturnValue({ id: 'uuid-1', role: 'superadmin' } as any);
      mockUserService.resetUserPassword.mockResolvedValue(true);

      const res = await request(app)
        .put('/api/users/uuid-target/password')
        .set('Cookie', ['accessToken=valid-token'])
        .send({ new_password: 'newsecurepassword' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should delete user successfully', async () => {
      mockJwt.verify.mockReturnValue({ id: 'uuid-1', role: 'superadmin' } as any);
      mockUserService.deleteUser.mockResolvedValue(true);

      const res = await request(app)
        .delete('/api/users/uuid-target')
        .set('Cookie', ['accessToken=valid-token']);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 400 when trying to delete superadmin', async () => {
      mockJwt.verify.mockReturnValue({ id: 'uuid-1', role: 'superadmin' } as any);
      mockUserService.deleteUser.mockRejectedValue(new Error('Superadmin cannot be deleted'));

      const res = await request(app)
        .delete('/api/users/uuid-target')
        .set('Cookie', ['accessToken=valid-token']);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Superadmin cannot be deleted');
    });
  });
});
