import { Request, Response } from 'express';
import * as userService from '../services/userService';
import logger from '../utils/logger';
import { formatSuccess, formatError } from '../utils/responseFormatter';

// Template handler untuk mengambil semua user
export const getUsers = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const search = req.query.search as string || '';

    const { users, total } = await userService.getAllUsers(page, limit, search);
    const totalPage = Math.ceil(total / limit);

    res.json(formatSuccess(users, { page, limit, total, totalPage }));
  } catch (error: any) {
    logger.error('Error fetching users', error);
    res.status(500).json(formatError(error.message || 'Failed to fetch users'));
  }
};

// Template handler untuk mengambil user berdasarkan ID
export const getUserById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const user = await userService.getUserById(id);
    res.json(formatSuccess(user));
  } catch (error: any) {
    logger.error(`Error fetching user ${req.params.id}`, error);
    if (error.message === 'User not found') {
      res.status(404).json(formatError(error.message));
    } else {
      res.status(500).json(formatError(error.message || 'Failed to fetch user'));
    }
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const { fullname, email, password, role } = req.body;
    if (!fullname || !email || !password || !role) {
      res.status(400).json(formatError('Fullname, email, password, and role are required'));
      return;
    }

    const newUser = await userService.createUser({
      fullname,
      email,
      password,
      role,
      is_active: true
    });

    res.status(201).json(formatSuccess(newUser));
  } catch (error: any) {
    logger.error('Error creating user', error);
    if (error.message === 'Email is already in use') {
      res.status(400).json(formatError(error.message));
    } else {
      res.status(500).json(formatError(error.message || 'Failed to create user'));
    }
  }
};

export const updateUser = async (req: any, res: Response) => {
  try {
    const id = req.params.id as string;
    const requesterId = req.user.id;
    const { fullname, email, role } = req.body;

    const updatedUser = await userService.updateUser(id, requesterId, { fullname, email, role });
    res.json(formatSuccess(updatedUser));
  } catch (error: any) {
    logger.error(`Error updating user ${req.params.id}`, error);
    if (error.message === 'User not found') {
      res.status(404).json(formatError(error.message));
    } else if (error.message.includes('superadmin') || error.message.includes('Email is already')) {
      res.status(400).json(formatError(error.message));
    } else {
      res.status(500).json(formatError(error.message || 'Failed to update user'));
    }
  }
};

export const updateUserStatus = async (req: any, res: Response) => {
  try {
    const id = req.params.id as string;
    const requesterId = req.user.id;
    const { is_active } = req.body;

    if (is_active === undefined) {
      res.status(400).json(formatError('is_active is required'));
      return;
    }

    const updatedUser = await userService.updateUserStatus(id, requesterId, is_active);
    res.json(formatSuccess(updatedUser));
  } catch (error: any) {
    logger.error(`Error updating status for user ${req.params.id}`, error);
    if (error.message === 'User not found') {
      res.status(404).json(formatError(error.message));
    } else if (error.message.includes('superadmin') || error.message.includes('deactivate yourself')) {
      res.status(400).json(formatError(error.message));
    } else {
      res.status(500).json(formatError(error.message || 'Failed to update user status'));
    }
  }
};

export const resetPassword = async (req: any, res: Response) => {
  try {
    const id = req.params.id as string;
    const requesterId = req.user.id;
    const { new_password } = req.body;

    if (!new_password || new_password.length < 6) {
      res.status(400).json(formatError('new_password is required and must be at least 6 characters'));
      return;
    }

    await userService.resetUserPassword(id, requesterId, new_password);
    res.json(formatSuccess({ message: 'Password reset successfully' }));
  } catch (error: any) {
    logger.error(`Error resetting password for user ${req.params.id}`, error);
    if (error.message === 'User not found') {
      res.status(404).json(formatError(error.message));
    } else if (error.message.includes('superadmin')) {
      res.status(400).json(formatError(error.message));
    } else {
      res.status(500).json(formatError(error.message || 'Failed to reset password'));
    }
  }
};

export const deleteUser = async (req: any, res: Response) => {
  try {
    const id = req.params.id as string;
    const requesterId = req.user.id;

    await userService.deleteUser(id, requesterId);
    res.json(formatSuccess({ message: 'User deleted successfully' }));
  } catch (error: any) {
    logger.error(`Error deleting user ${req.params.id}`, error);
    if (error.message === 'User not found') {
      res.status(404).json(formatError(error.message));
    } else if (error.message.includes('Superadmin') || error.message.includes('yourself')) {
      res.status(400).json(formatError(error.message));
    } else {
      res.status(500).json(formatError(error.message || 'Failed to delete user'));
    }
  }
};
