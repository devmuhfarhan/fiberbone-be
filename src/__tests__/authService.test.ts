import * as authService from '../services/authService';
import * as userModel from '../models/userModel';
import * as rolePermissionModel from '../models/rolePermissionModel';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

jest.mock('../models/userModel');
jest.mock('../models/rolePermissionModel');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('Auth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test_secret';
    process.env.REFRESH_TOKEN_SECRET = 'test_refresh_secret';
  });

  describe('register', () => {
    const mockUserData = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User'
    };

    it('should register a new user successfully', async () => {
      (userModel.findByEmail as any).mockResolvedValue(null);
      (bcrypt.genSalt as any).mockResolvedValue('salt');
      (bcrypt.hash as any).mockResolvedValue('hashed_password');
      (userModel.createUser as any).mockResolvedValue({
        id: '1',
        ...mockUserData,
        password: 'hashed_password',
        is_active: true,
        role: 'cashier'
      });

      const result = await authService.register(mockUserData);

      expect(userModel.findByEmail).toHaveBeenCalledWith(mockUserData.email);
      expect(bcrypt.hash).toHaveBeenCalledWith(mockUserData.password, 'salt');
      expect(userModel.createUser).toHaveBeenCalled();
      expect(result).toHaveProperty('id', '1');
      expect(result).toHaveProperty('email', mockUserData.email);
    });

    it('should throw an error if email is already registered', async () => {
      (userModel.findByEmail as any).mockResolvedValue({ id: '1', email: mockUserData.email });

      await expect(authService.register(mockUserData)).rejects.toThrow('Email already registered');
      expect(userModel.createUser).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      password: 'hashed_password',
      is_active: true,
      role: 'superadmin' as any // or 'superadmin' but let's just cast or use proper string
    };

    it('should login successfully and return tokens', async () => {
      (userModel.findByEmail as any).mockResolvedValue(mockUser);
      (bcrypt.compare as any).mockResolvedValue(true);
      (jwt.sign as any)
        .mockReturnValueOnce('access_token')
        .mockReturnValueOnce('refresh_token');
      (rolePermissionModel.findByRole as any).mockResolvedValue([
        { module_slug: 'pos', action: 'read', allowed: true },
        { module_slug: 'pos', action: 'create', allowed: false },
        { module_slug: 'pelanggan', action: 'read', allowed: true }
      ]);

      const result = await authService.login('test@example.com', 'password123');

      expect(userModel.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashed_password');
      expect(rolePermissionModel.findByRole).toHaveBeenCalledWith(mockUser.role);
      expect(jwt.sign).toHaveBeenCalledTimes(2);
      expect(result).toHaveProperty('accessToken', 'access_token');
      expect(result).toHaveProperty('refreshToken', 'refresh_token');
      expect(result.user).not.toHaveProperty('password');
      expect(result.user).toHaveProperty('permissions', {
        pos: ['read'],
        pelanggan: ['read']
      });
    });

    it('should throw an error for invalid email', async () => {
      (userModel.findByEmail as any).mockResolvedValue(null);

      await expect(authService.login('wrong@example.com', 'password123')).rejects.toThrow('Invalid email or password');
    });

    it('should throw an error for invalid password', async () => {
      (userModel.findByEmail as any).mockResolvedValue(mockUser);
      (bcrypt.compare as any).mockResolvedValue(false);

      await expect(authService.login('test@example.com', 'wrongpassword')).rejects.toThrow('Invalid email or password');
    });

    it('should throw an error if account is deactivated', async () => {
      (userModel.findByEmail as any).mockResolvedValue({ ...mockUser, is_active: false });
      (bcrypt.compare as any).mockResolvedValue(true);

      await expect(authService.login('test@example.com', 'password123')).rejects.toThrow('Account is deactivated');
    });
  });

  describe('refreshAccessToken', () => {
    it('should return a new access token for valid refresh token', async () => {
      const mockDecoded = { id: '1', role: 'admin' };
      (jwt.verify as any).mockReturnValue(mockDecoded);
      (jwt.sign as any).mockReturnValue('new_access_token');

      const result = await authService.refreshAccessToken('valid_refresh_token');

      expect(jwt.verify).toHaveBeenCalledWith('valid_refresh_token', process.env.REFRESH_TOKEN_SECRET as string);
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: mockDecoded.id, role: mockDecoded.role },
        process.env.JWT_SECRET as string,
        { expiresIn: '15m' }
      );
      expect(result).toHaveProperty('accessToken', 'new_access_token');
    });

    it('should throw an error for invalid refresh token', async () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(authService.refreshAccessToken('invalid_token')).rejects.toThrow('Invalid or expired refresh token');
    });
  });
});
