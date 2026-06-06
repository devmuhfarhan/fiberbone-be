import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as userModel from '../models/userModel';
import * as rolePermissionModel from '../models/rolePermissionModel';
import logger from '../utils/logger';

export const register = async (userData: any) => {
  try {
    const existingUser = await userModel.findByEmail(userData.email);
    if (existingUser) {
      throw new Error('Email already registered');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);

    const newUser = await userModel.createUser({
      ...userData,
      password: hashedPassword,
      is_active: true,
      role: userData.role || 'cashier',
    });

    return newUser;
  } catch (error) {
    logger.error('Error in authService.register', error);
    throw error;
  }
};

export const login = async (email: string, password: string): Promise<{ accessToken: string, refreshToken: string, user: userModel.User }> => {
  try {
    const user = await userModel.findByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, user.password as string);
    if (!isMatch) {
      throw new Error('Invalid email or password');
    }

    if (!user.is_active) {
      throw new Error('Account is deactivated');
    }

    const payload = {
      id: user.id,
      role: user.role,
    };

    const secret = process.env.JWT_SECRET as string;
    const refreshSecret = process.env.REFRESH_TOKEN_SECRET as string;

    const accessToken = jwt.sign(payload, secret, { expiresIn: '15m' });
    const refreshToken = jwt.sign(payload, refreshSecret, { expiresIn: '7d' });

    // Hapus password sebelum dikembalikan
    delete user.password;

    // Fetch and map permissions
    const permissionsRows = await rolePermissionModel.findByRole(user.role);
    const permissions: Record<string, string[]> = {};
    for (const row of permissionsRows) {
      if (row.allowed) {
        if (!permissions[row.module_slug]) permissions[row.module_slug] = [];
        permissions[row.module_slug].push(row.action);
      }
    }
    user.permissions = permissions;

    return { accessToken, refreshToken, user };
  } catch (error) {
    logger.error('Error in authService.login', error);
    throw error;
  }
};

export const refreshAccessToken = async (refreshToken: string): Promise<{ accessToken: string }> => {
  try {
    const refreshSecret = process.env.REFRESH_TOKEN_SECRET as string;
    const decoded: any = jwt.verify(refreshToken, refreshSecret);
    
    const payload = {
      id: decoded.id,
      role: decoded.role,
    };
    
    const secret = process.env.JWT_SECRET as string;
    const accessToken = jwt.sign(payload, secret, { expiresIn: '15m' });
    
    return { accessToken };
  } catch (error) {
    logger.error('Error in authService.refreshAccessToken', error);
    throw new Error('Invalid or expired refresh token');
  }
};
