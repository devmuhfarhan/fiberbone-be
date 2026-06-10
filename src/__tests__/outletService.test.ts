import * as outletService from '../services/outletService';
import * as outletModel from '../models/outletModel';
import * as outletUserModel from '../models/outletUserModel';
import * as userModel from '../models/userModel';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

jest.mock('../models/outletModel');
jest.mock('../models/outletUserModel');
jest.mock('../models/userModel');
jest.mock('../models/accountModel');

describe('Outlet Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createOutlet', () => {
    it('should create an outlet if owner is superadmin', async () => {
      (userModel.findById as any).mockResolvedValue({ id: '1', role: 'superadmin' });
      (outletModel.createOutlet as any).mockResolvedValue({ id: '10', name: 'Test Outlet', owner_id: '1' });

      const result = await outletService.createOutlet('1', { name: 'Test Outlet' });

      expect(userModel.findById).toHaveBeenCalledWith('1');
      expect(outletModel.createOutlet).toHaveBeenCalledWith({ name: 'Test Outlet', owner_id: '1' });
      expect(result).toHaveProperty('id', '10');
    });

    it('should throw an error if owner is not superadmin', async () => {
      (userModel.findById as any).mockResolvedValue({ id: '1', role: 'cashier' });

      await expect(outletService.createOutlet('1', { name: 'Test Outlet' })).rejects.toThrow('Only superadmin can create outlets');
    });
  });

  describe('getOutlets', () => {
    it('should return outlets by owner id if role is superadmin', async () => {
      const mockOutlets = [{ id: '1', name: 'Outlet 1' }];
      (outletModel.findByOwnerId as any).mockResolvedValue(mockOutlets);

      const result = await outletService.getOutlets('1', 'superadmin');

      expect(outletModel.findByOwnerId).toHaveBeenCalledWith('1', '');
      expect(result).toEqual(mockOutlets);
    });

    it('should return outlet by user id if role is not superadmin', async () => {
      const mockOutlet = { id: '1', name: 'Outlet 1' };
      (outletModel.findByUserId as any).mockResolvedValue(mockOutlet);

      const result = await outletService.getOutlets('1', 'cashier');

      expect(outletModel.findByUserId).toHaveBeenCalledWith('1');
      expect(result).toEqual([mockOutlet]);
    });
  });

  describe('getOutletById', () => {
    const mockOutlet = { id: '10', name: 'Test Outlet' };

    it('should return outlet if superadmin', async () => {
      (outletModel.findById as any).mockResolvedValue(mockOutlet);

      const result = await outletService.getOutletById('10', '1', 'superadmin');

      expect(outletModel.findById).toHaveBeenCalledWith('10');
      expect(result).toEqual(mockOutlet);
    });

    it('should return outlet if normal user has access', async () => {
      (outletModel.findById as any).mockResolvedValue(mockOutlet);
      (outletUserModel.isUserInOutlet as any).mockResolvedValue(true);

      const result = await outletService.getOutletById('10', '2', 'cashier');

      expect(outletUserModel.isUserInOutlet).toHaveBeenCalledWith('10', '2');
      expect(result).toEqual(mockOutlet);
    });

    it('should throw error if normal user has no access', async () => {
      (outletModel.findById as any).mockResolvedValue(mockOutlet);
      (outletUserModel.isUserInOutlet as any).mockResolvedValue(false);

      await expect(outletService.getOutletById('10', '2', 'cashier')).rejects.toThrow('Access denied to this outlet');
    });
  });

  describe('updateOutlet', () => {
    it('should update outlet if requester is owner', async () => {
      const mockOutlet = { id: '10', owner_id: '1' };
      (outletModel.findById as any).mockResolvedValue(mockOutlet);
      (outletModel.updateOutlet as any).mockResolvedValue({ ...mockOutlet, name: 'New Name' });

      const result = await outletService.updateOutlet('10', '1', { name: 'New Name' });

      expect(outletModel.updateOutlet).toHaveBeenCalledWith('10', { name: 'New Name' });
      expect(result).toHaveProperty('name', 'New Name');
    });

    it('should throw error if requester is not owner', async () => {
      const mockOutlet = { id: '10', owner_id: '1' };
      (outletModel.findById as any).mockResolvedValue(mockOutlet);

      await expect(outletService.updateOutlet('10', '2', { name: 'New Name' })).rejects.toThrow('Only the outlet owner can update it');
    });
  });

  describe('assignUserToOutlet', () => {
    it('should assign user to outlet', async () => {
      (outletModel.findById as any).mockResolvedValue({ id: '10', owner_id: '1' });
      (userModel.findById as any).mockResolvedValue({ id: '2', role: 'cashier' });
      (outletUserModel.isUserInOutlet as any).mockResolvedValue(false);
      (outletUserModel.assignUser as any).mockResolvedValue({ outlet_id: '10', user_id: '2' });

      const result = await outletService.assignUserToOutlet('10', '2', '1');

      expect(outletUserModel.assignUser).toHaveBeenCalledWith('10', '2');
      expect(result).toEqual({ outlet_id: '10', user_id: '2' });
    });
  });
});
