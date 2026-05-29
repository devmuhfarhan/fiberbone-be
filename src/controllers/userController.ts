import { Request, Response } from 'express';
import * as userService from '../services/userService';
import logger from '../utils/logger';
import { formatSuccess, formatError } from '../utils/responseFormatter';

// Template handler untuk mengambil semua user
export const getUsers = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;

    const { users, total } = await userService.getAllUsers(page, limit);
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
