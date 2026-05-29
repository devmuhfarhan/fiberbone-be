import { Request, Response } from 'express';
import * as authService from '../services/authService';
import logger from '../utils/logger';
import { formatSuccess, formatError } from '../utils/responseFormatter';

export const register = async (req: Request, res: Response) => {
  try {
    const { fullname, email, password, role } = req.body;
    
    if (!fullname || !email || !password) {
      return res.status(400).json(formatError('Fullname, email, and password are required'));
    }

    const user = await authService.register({ fullname, email, password, role });
    res.status(201).json(formatSuccess(user));
  } catch (error: any) {
    logger.error('Register failed', error);
    const status = error.message === 'Email already registered' ? 400 : 500;
    res.status(status).json(formatError(error.message || 'Registration failed'));
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json(formatError('Email and password are required'));
    }

    const { accessToken, refreshToken, user } = await authService.login(email, password);

    // Set token to HTTP-only cookie
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000 // 15 minutes
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json(formatSuccess({ user }));
  } catch (error: any) {
    logger.error('Login failed', error);
    const status = (error.message === 'Invalid email or password' || error.message === 'Account is deactivated') ? 401 : 500;
    res.status(status).json(formatError(error.message || 'Login failed'));
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.json(formatSuccess(null));
  } catch (error: any) {
    logger.error('Logout failed', error);
    res.status(500).json(formatError('Logout failed'));
  }
};

export const refresh = async (req: Request, res: Response) => {
  try {
    const currentRefreshToken = req.cookies?.refreshToken;
    if (!currentRefreshToken) {
      return res.status(401).json(formatError('Refresh token is missing'));
    }

    const { accessToken } = await authService.refreshAccessToken(currentRefreshToken);

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000 // 15 minutes
    });

    res.json(formatSuccess(null));
  } catch (error: any) {
    logger.error('Refresh token failed', error);
    res.status(403).json(formatError(error.message || 'Refresh token failed'));
  }
};
