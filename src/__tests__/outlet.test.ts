import { createOutlet, updateOutlet, getOutletById } from '../services/outletService';
import * as outletModel from '../models/outletModel';
import * as userModel from '../models/userModel';
import * as accountModel from '../models/accountModel';

jest.mock('../models/outletModel');
jest.mock('../models/userModel');
jest.mock('../models/accountModel');
jest.mock('../utils/logger');

describe('Outlet Service - Settings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createOutlet', () => {
    it('should create an outlet with description and receipt_footer', async () => {
      const ownerId = 'owner_id';
      const inputData = {
        name: 'Fiberbone Store 1',
        address: 'Sudirman Street 10',
        phone: '08123456789',
        logo_url: 'http://example.com/logo.png',
        description: 'Premium fiberbone store',
        receipt_footer: 'Thank you for shopping!'
      };

      (userModel.findById as jest.Mock).mockResolvedValue({ id: ownerId, role: 'superadmin' });
      (outletModel.createOutlet as jest.Mock).mockResolvedValue({
        id: 'outlet_id',
        owner_id: ownerId,
        ...inputData,
        is_active: true
      });
      (accountModel.seedDefaultAccounts as jest.Mock).mockResolvedValue(undefined);

      const result = await createOutlet(ownerId, inputData);

      expect(userModel.findById).toHaveBeenCalledWith(ownerId);
      expect(outletModel.createOutlet).toHaveBeenCalledWith({
        ...inputData,
        owner_id: ownerId
      });
      expect(accountModel.seedDefaultAccounts).toHaveBeenCalledWith('outlet_id');
      expect(result).toEqual(expect.objectContaining({
        description: 'Premium fiberbone store',
        receipt_footer: 'Thank you for shopping!'
      }));
    });

    it('should throw error if user is not superadmin', async () => {
      const ownerId = 'owner_id';
      (userModel.findById as jest.Mock).mockResolvedValue({ id: ownerId, role: 'operational' });

      await expect(createOutlet(ownerId, { name: 'Test' })).rejects.toThrow('Only superadmin can create outlets');
    });
  });

  describe('updateOutlet', () => {
    it('should update description and receipt_footer', async () => {
      const outletId = 'outlet_id';
      const ownerId = 'owner_id';
      const updateData = {
        description: 'Updated store description',
        receipt_footer: 'Please come back again!'
      };

      (outletModel.findById as jest.Mock).mockResolvedValue({
        id: outletId,
        owner_id: ownerId,
        name: 'Original Store'
      });
      (outletModel.updateOutlet as jest.Mock).mockResolvedValue({
        id: outletId,
        owner_id: ownerId,
        name: 'Original Store',
        ...updateData
      });

      const result = await updateOutlet(outletId, ownerId, updateData);

      expect(outletModel.findById).toHaveBeenCalledWith(outletId);
      expect(outletModel.updateOutlet).toHaveBeenCalledWith(outletId, updateData);
      expect(result).toEqual(expect.objectContaining({
        description: 'Updated store description',
        receipt_footer: 'Please come back again!'
      }));
    });
  });

  describe('getOutlets', () => {
    it('should return all owner outlets for superadmin', async () => {
      (outletModel.findByOwnerId as jest.Mock).mockResolvedValue([{ id: '1', name: 'Outlet 1' }]);
      const result = await require('../services/outletService').getOutlets('superadmin_id', 'superadmin');
      expect(result.length).toBe(1);
      expect(outletModel.findByOwnerId).toHaveBeenCalledWith('superadmin_id', '');
    });

    it('should return assigned outlet for non-superadmin', async () => {
      (outletModel.findByUserId as jest.Mock).mockResolvedValue({ id: '1', name: 'Outlet 1' });
      const result = await require('../services/outletService').getOutlets('cashier_id', 'cashier');
      expect(result.length).toBe(1);
      expect(outletModel.findByUserId).toHaveBeenCalledWith('cashier_id');
    });

    it('should handle errors in getOutlets', async () => {
      (outletModel.findByOwnerId as jest.Mock).mockRejectedValue(new Error('DB Error'));
      await expect(require('../services/outletService').getOutlets('superadmin_id', 'superadmin')).rejects.toThrow('DB Error');
    });
  });

  describe('getOutletById', () => {
    it('should return outlet details for superadmin', async () => {
      (outletModel.findById as jest.Mock).mockResolvedValue({ id: '1', name: 'Outlet 1' });
      const result = await require('../services/outletService').getOutletById('1', 'superadmin_id', 'superadmin');
      expect(result.id).toBe('1');
    });

    it('should block access if non-superadmin is not assigned to outlet', async () => {
      (outletModel.findById as jest.Mock).mockResolvedValue({ id: '1', name: 'Outlet 1' });
      const outletUserModel = require('../models/outletUserModel');
      outletUserModel.isUserInOutlet = jest.fn().mockResolvedValue(false);

      await expect(require('../services/outletService').getOutletById('1', 'cashier_id', 'cashier'))
        .rejects.toThrow('Access denied to this outlet');
    });

    it('should return 404 if outlet not found', async () => {
      (outletModel.findById as jest.Mock).mockResolvedValue(null);
      await expect(require('../services/outletService').getOutletById('invalid_id', 'superadmin_id', 'superadmin'))
        .rejects.toThrow('Outlet not found');
    });
  });

  describe('assignUserToOutlet', () => {
    it('should assign user successfully if requested by owner', async () => {
      (outletModel.findById as jest.Mock).mockResolvedValue({ id: '1', owner_id: 'owner_id' });
      (userModel.findById as jest.Mock).mockResolvedValue({ id: 'user_id', role: 'cashier' });
      const outletUserModel = require('../models/outletUserModel');
      outletUserModel.isUserInOutlet = jest.fn().mockResolvedValue(false);
      outletUserModel.assignUser = jest.fn().mockResolvedValue({ outlet_id: '1', user_id: 'user_id' });

      const result = await require('../services/outletService').assignUserToOutlet('1', 'user_id', 'owner_id');
      expect(result).toBeDefined();
    });

    it('should reject if requester is not the owner', async () => {
      (outletModel.findById as jest.Mock).mockResolvedValue({ id: '1', owner_id: 'owner_id' });
      await expect(require('../services/outletService').assignUserToOutlet('1', 'user_id', 'wrong_owner'))
        .rejects.toThrow('Only the outlet owner can assign users');
    });

    it('should reject if trying to assign a superadmin', async () => {
      (outletModel.findById as jest.Mock).mockResolvedValue({ id: '1', owner_id: 'owner_id' });
      (userModel.findById as jest.Mock).mockResolvedValue({ id: 'user_id', role: 'superadmin' });
      await expect(require('../services/outletService').assignUserToOutlet('1', 'user_id', 'owner_id'))
        .rejects.toThrow('Superadmin cannot be assigned to an outlet');
    });

    it('should reject if user already assigned', async () => {
      (outletModel.findById as jest.Mock).mockResolvedValue({ id: '1', owner_id: 'owner_id' });
      (userModel.findById as jest.Mock).mockResolvedValue({ id: 'user_id', role: 'cashier' });
      const outletUserModel = require('../models/outletUserModel');
      outletUserModel.isUserInOutlet = jest.fn().mockResolvedValue(true);

      await expect(require('../services/outletService').assignUserToOutlet('1', 'user_id', 'owner_id'))
        .rejects.toThrow('User is already assigned to this outlet');
    });
  });

  describe('removeUserFromOutlet', () => {
    it('should remove user successfully', async () => {
      (outletModel.findById as jest.Mock).mockResolvedValue({ id: '1', owner_id: 'owner_id' });
      const outletUserModel = require('../models/outletUserModel');
      outletUserModel.removeUser = jest.fn().mockResolvedValue(true);

      const result = await require('../services/outletService').removeUserFromOutlet('1', 'user_id', 'owner_id');
      expect(result).toBe(true);
    });

    it('should reject if user not assigned', async () => {
      (outletModel.findById as jest.Mock).mockResolvedValue({ id: '1', owner_id: 'owner_id' });
      const outletUserModel = require('../models/outletUserModel');
      outletUserModel.removeUser = jest.fn().mockResolvedValue(false);

      await expect(require('../services/outletService').removeUserFromOutlet('1', 'user_id', 'owner_id'))
        .rejects.toThrow('User is not assigned to this outlet');
    });
  });

  describe('getOutletUsers', () => {
    it('should return users for superadmin', async () => {
      (outletModel.findById as jest.Mock).mockResolvedValue({ id: '1', owner_id: 'owner_id' });
      const outletUserModel = require('../models/outletUserModel');
      outletUserModel.findUsersByOutlet = jest.fn().mockResolvedValue([{ id: 'user_id' }]);

      const result = await require('../services/outletService').getOutletUsers('1', 'owner_id', 'superadmin');
      expect(result.length).toBe(1);
    });
  });
});
