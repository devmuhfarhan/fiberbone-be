import * as userModel from '../models/userModel';
import logger from '../utils/logger';

// Template business logic (contoh: Get all users dengan pagination)
export const getAllUsers = async (page: number, limit: number) => {
  try {
    const offset = (page - 1) * limit;
    const result = await userModel.findAll(limit, offset);
    return result;
  } catch (error) {
    logger.error('Error in userService.getAllUsers', error);
    throw error;
  }
};

// Template business logic (contoh: Get user by ID)
export const getUserById = async (id: string) => {
  try {
    const user = await userModel.findById(id);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  } catch (error) {
    logger.error(`Error in userService.getUserById for id ${id}`, error);
    throw error;
  }
};
