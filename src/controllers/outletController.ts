import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import * as outletService from '../services/outletService';
import { formatSuccess, formatError } from '../utils/responseFormatter';
import logger from '../utils/logger';

// POST /api/outlets — buat outlet baru (superadmin)
export const createOutlet = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, address, phone, logo_url, description, receipt_footer } = req.body;
    if (!name) {
      res.status(400).json(formatError('Outlet name is required'));
      return;
    }

    const outlet = await outletService.createOutlet(req.user!.id, {
      name,
      address,
      phone,
      logo_url,
      description,
      receipt_footer
    });
    res.status(201).json(formatSuccess(outlet));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create outlet';
    logger.error('outletController.createOutlet error', error);
    res.status(400).json(formatError(message));
  }
};

// GET /api/outlets — daftar outlet sesuai role
export const getOutlets = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const search = req.query.search as string || '';
    const outlets = await outletService.getOutlets(req.user!.id, req.user!.role, search);
    res.status(200).json(formatSuccess(outlets));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to retrieve outlets';
    logger.error('outletController.getOutlets error', error);
    res.status(500).json(formatError(message));
  }
};

// GET /api/outlets/:id — detail outlet
export const getOutletById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const outletId = req.params.id as string;
    const outlet = await outletService.getOutletById(outletId, req.user!.id, req.user!.role);
    res.status(200).json(formatSuccess(outlet));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to retrieve outlet';
    logger.error('outletController.getOutletById error', error);
    const status = message === 'Outlet not found' ? 404 : message.includes('denied') ? 403 : 500;
    res.status(status).json(formatError(message));
  }
};

// PUT /api/outlets/:id — update outlet (owner)
export const updateOutlet = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const outletId = req.params.id as string;
    const { name, address, phone, logo_url, description, receipt_footer } = req.body;
    const outlet = await outletService.updateOutlet(outletId, req.user!.id, {
      name,
      address,
      phone,
      logo_url,
      description,
      receipt_footer
    });
    res.status(200).json(formatSuccess(outlet));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update outlet';
    logger.error('outletController.updateOutlet error', error);
    const status = message === 'Outlet not found' ? 404 : message.includes('owner') ? 403 : 400;
    res.status(status).json(formatError(message));
  }
};

// POST /api/outlets/:id/users — assign user ke outlet (superadmin/owner)
export const assignUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const outletId = req.params.id as string;
    const { user_id } = req.body;
    if (!user_id) {
      res.status(400).json(formatError('user_id is required'));
      return;
    }

    const result = await outletService.assignUserToOutlet(outletId, user_id as string, req.user!.id);
    res.status(201).json(formatSuccess(result));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to assign user';
    logger.error('outletController.assignUser error', error);
    const status = message.includes('not found') ? 404 : message.includes('denied') || message.includes('owner') ? 403 : 400;
    res.status(status).json(formatError(message));
  }
};

// DELETE /api/outlets/:id/users/:userId — hapus user dari outlet
export const removeUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const outletId = req.params.id as string;
    const userId = req.params.userId as string;
    await outletService.removeUserFromOutlet(outletId, userId, req.user!.id);
    res.status(200).json(formatSuccess(null));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to remove user';
    logger.error('outletController.removeUser error', error);
    const status = message.includes('not found') ? 404 : message.includes('owner') ? 403 : 400;
    res.status(status).json(formatError(message));
  }
};

// GET /api/outlets/:id/users — daftar user di outlet
export const getOutletUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const outletId = req.params.id as string;
    const users = await outletService.getOutletUsers(outletId, req.user!.id, req.user!.role);
    res.status(200).json(formatSuccess(users));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to retrieve outlet users';
    logger.error('outletController.getOutletUsers error', error);
    const status = message.includes('not found') ? 404 : message.includes('denied') ? 403 : 500;
    res.status(status).json(formatError(message));
  }
};
