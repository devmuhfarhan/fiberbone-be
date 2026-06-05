import * as userModel from '../models/userModel';
import bcrypt from 'bcryptjs';
import logger from '../utils/logger';

// Template business logic (contoh: Get all users dengan pagination)
export const getAllUsers = async (page: number, limit: number, search: string = '') => {
  try {
    const offset = (page - 1) * limit;
    const result = await userModel.findAll(limit, offset, search);
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

export const createUser = async (data: Omit<userModel.User, 'id' | 'created_at' | 'updated_at'>) => {
  try {
    const existingUser = await userModel.findByEmail(data.email);
    if (existingUser) {
      throw new Error('Email is already in use');
    }

    let hashedPassword = undefined;
    if (data.password) {
      hashedPassword = await bcrypt.hash(data.password, 10);
    }

    const newUser = await userModel.createUser({
      ...data,
      password: hashedPassword
    });
    
    return newUser;
  } catch (error) {
    logger.error('Error in userService.createUser', error);
    throw error;
  }
};

export const updateUser = async (id: string, requesterId: string, data: { fullname?: string; email?: string; role?: string }) => {
  try {
    const userToEdit = await userModel.findById(id);
    if (!userToEdit) throw new Error('User not found');

    if (userToEdit.role === 'superadmin' && id !== requesterId) {
      throw new Error('You cannot edit another superadmin');
    }

    if (data.email && data.email !== userToEdit.email) {
      const existingUser = await userModel.findByEmail(data.email);
      if (existingUser) throw new Error('Email is already in use');
    }

    const updatedUser = await userModel.updateUser(id, data);
    return updatedUser;
  } catch (error) {
    logger.error('Error in userService.updateUser', error);
    throw error;
  }
};

export const updateUserStatus = async (id: string, requesterId: string, isActive: boolean) => {
  try {
    const userToEdit = await userModel.findById(id);
    if (!userToEdit) throw new Error('User not found');

    if (userToEdit.role === 'superadmin' && id !== requesterId) {
      throw new Error('You cannot change status of another superadmin');
    }

    if (id === requesterId && !isActive) {
      throw new Error('You cannot deactivate yourself');
    }

    const updatedUser = await userModel.updateStatus(id, isActive);
    return updatedUser;
  } catch (error) {
    logger.error('Error in userService.updateUserStatus', error);
    throw error;
  }
};

export const resetUserPassword = async (id: string, requesterId: string, newPassword: string) => {
  try {
    const userToEdit = await userModel.findById(id);
    if (!userToEdit) throw new Error('User not found');

    if (userToEdit.role === 'superadmin' && id !== requesterId) {
      throw new Error('You cannot reset password for another superadmin');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const success = await userModel.updatePassword(id, hashedPassword);
    if (!success) throw new Error('Failed to update password');
    
    return true;
  } catch (error) {
    logger.error('Error in userService.resetUserPassword', error);
    throw error;
  }
};

export const deleteUser = async (id: string, requesterId: string) => {
  try {
    const userToDelete = await userModel.findById(id);
    if (!userToDelete) throw new Error('User not found');

    if (userToDelete.role === 'superadmin') {
      throw new Error('Superadmin cannot be deleted');
    }

    if (id === requesterId) {
      throw new Error('You cannot delete yourself');
    }

    const success = await userModel.deleteUser(id);
    if (!success) throw new Error('Failed to delete user');
    
    return true;
  } catch (error) {
    logger.error('Error in userService.deleteUser', error);
    throw error;
  }
};
