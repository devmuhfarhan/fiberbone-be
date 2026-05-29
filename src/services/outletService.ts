import * as outletModel from '../models/outletModel';
import * as outletUserModel from '../models/outletUserModel';
import * as userModel from '../models/userModel';
import logger from '../utils/logger';

// Buat outlet baru — hanya superadmin
export const createOutlet = async (
  ownerId: string,
  data: { name: string; address?: string; phone?: string; logo_url?: string }
) => {
  try {
    const owner = await userModel.findById(ownerId);
    if (!owner || owner.role !== 'superadmin') {
      throw new Error('Only superadmin can create outlets');
    }

    const outlet = await outletModel.createOutlet({ ...data, owner_id: ownerId });
    return outlet;
  } catch (error) {
    logger.error('Error in outletService.createOutlet', error);
    throw error;
  }
};

// Ambil daftar outlet sesuai role
export const getOutlets = async (userId: string, role: string) => {
  try {
    if (role === 'superadmin') {
      return await outletModel.findByOwnerId(userId);
    }
    const outlet = await outletModel.findByUserId(userId);
    return outlet ? [outlet] : [];
  } catch (error) {
    logger.error('Error in outletService.getOutlets', error);
    throw error;
  }
};

// Ambil detail outlet — validasi akses
export const getOutletById = async (outletId: string, userId: string, role: string) => {
  try {
    const outlet = await outletModel.findById(outletId);
    if (!outlet) throw new Error('Outlet not found');

    if (role !== 'superadmin') {
      const hasAccess = await outletUserModel.isUserInOutlet(outletId, userId);
      if (!hasAccess) throw new Error('Access denied to this outlet');
    }

    return outlet;
  } catch (error) {
    logger.error('Error in outletService.getOutletById', error);
    throw error;
  }
};

// Update outlet — hanya owner (superadmin)
export const updateOutlet = async (
  outletId: string,
  ownerId: string,
  data: { name?: string; address?: string; phone?: string; logo_url?: string }
) => {
  try {
    const outlet = await outletModel.findById(outletId);
    if (!outlet) throw new Error('Outlet not found');
    if (outlet.owner_id !== ownerId) throw new Error('Only the outlet owner can update it');

    return await outletModel.updateOutlet(outletId, data);
  } catch (error) {
    logger.error('Error in outletService.updateOutlet', error);
    throw error;
  }
};

// Tetapkan user ke outlet
export const assignUserToOutlet = async (outletId: string, userId: string, requesterId: string) => {
  try {
    const outlet = await outletModel.findById(outletId);
    if (!outlet) throw new Error('Outlet not found');
    if (outlet.owner_id !== requesterId) throw new Error('Only the outlet owner can assign users');

    const user = await userModel.findById(userId);
    if (!user) throw new Error('User not found');
    if (user.role === 'superadmin') throw new Error('Superadmin cannot be assigned to an outlet');

    const alreadyAssigned = await outletUserModel.isUserInOutlet(outletId, userId);
    if (alreadyAssigned) throw new Error('User is already assigned to this outlet');

    return await outletUserModel.assignUser(outletId, userId);
  } catch (error) {
    logger.error('Error in outletService.assignUserToOutlet', error);
    throw error;
  }
};

// Hapus user dari outlet
export const removeUserFromOutlet = async (outletId: string, userId: string, requesterId: string) => {
  try {
    const outlet = await outletModel.findById(outletId);
    if (!outlet) throw new Error('Outlet not found');
    if (outlet.owner_id !== requesterId) throw new Error('Only the outlet owner can remove users');

    const removed = await outletUserModel.removeUser(outletId, userId);
    if (!removed) throw new Error('User is not assigned to this outlet');
    return true;
  } catch (error) {
    logger.error('Error in outletService.removeUserFromOutlet', error);
    throw error;
  }
};

// Ambil daftar user di outlet
export const getOutletUsers = async (outletId: string, requesterId: string, role: string) => {
  try {
    const outlet = await outletModel.findById(outletId);
    if (!outlet) throw new Error('Outlet not found');

    if (role !== 'superadmin') {
      const hasAccess = await outletUserModel.isUserInOutlet(outletId, requesterId);
      if (!hasAccess) throw new Error('Access denied to this outlet');
    }

    return await outletUserModel.findUsersByOutlet(outletId);
  } catch (error) {
    logger.error('Error in outletService.getOutletUsers', error);
    throw error;
  }
};
