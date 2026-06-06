import * as userService from '../services/userService';
import * as userModel from '../models/userModel';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

jest.mock('../models/userModel');

describe('User Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllUsers', () => {
    it('should return a list of users with pagination', async () => {
      const mockUsers = [
        { id: '1', name: 'User One', email: 'user1@example.com' },
        { id: '2', name: 'User Two', email: 'user2@example.com' }
      ];
      
      (userModel.findAll as any).mockResolvedValue(mockUsers);

      const result = await userService.getAllUsers(1, 10);

      expect(userModel.findAll).toHaveBeenCalledWith(10, 0); // limit: 10, offset: 0
      expect(result).toEqual(mockUsers);
    });
  });

  describe('getUserById', () => {
    it('should return user by id', async () => {
      const mockUser = { id: '1', name: 'User One', email: 'user1@example.com' };
      (userModel.findById as any).mockResolvedValue(mockUser);

      const result = await userService.getUserById('1');

      expect(userModel.findById).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockUser);
    });

    it('should throw an error if user not found', async () => {
      (userModel.findById as any).mockResolvedValue(null);

      await expect(userService.getUserById('999')).rejects.toThrow('User not found');
    });
  });
});
