import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import * as permissionService from '../services/permissionService';
import { UserRole, PermissionAction } from '../models/rolePermissionModel';
import { formatSuccess, formatError } from '../utils/responseFormatter';
import logger from '../utils/logger';

const VALID_ROLES: UserRole[] = ['superadmin', 'cashier', 'finance', 'operational'];
const VALID_ACTIONS: PermissionAction[] = ['read', 'create', 'edit', 'delete', 'export', 'approve', 'pay', 'settings'];

// GET /api/permissions/:role — tampilkan matriks izin role
export const getPermissionMatrix = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const role = req.params.role as UserRole;

    if (!VALID_ROLES.includes(role)) {
      res.status(400).json(formatError(`Invalid role. Valid roles: ${VALID_ROLES.join(', ')}`));
      return;
    }

    const matrix = await permissionService.getPermissionMatrix(role);
    res.status(200).json(formatSuccess(matrix));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to retrieve permissions';
    logger.error('permissionController.getPermissionMatrix error', error);
    res.status(500).json(formatError(message));
  }
};

// PUT /api/permissions/:role — update satu izin
export const updatePermission = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const role = req.params.role as UserRole;
    const { module, action, allowed } = req.body as { module: string; action: PermissionAction; allowed: boolean };

    if (!VALID_ROLES.includes(role)) {
      res.status(400).json(formatError(`Invalid role. Valid roles: ${VALID_ROLES.join(', ')}`));
      return;
    }

    if (!module || !action || allowed === undefined) {
      res.status(400).json(formatError('Fields "module", "action", and "allowed" are required'));
      return;
    }

    if (!VALID_ACTIONS.includes(action)) {
      res.status(400).json(formatError(`Invalid action. Valid actions: ${VALID_ACTIONS.join(', ')}`));
      return;
    }

    await permissionService.updatePermission(role, module, action, Boolean(allowed));
    res.status(200).json(formatSuccess({ role, module, action, allowed }));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update permission';
    logger.error('permissionController.updatePermission error', error);
    res.status(500).json(formatError(message));
  }
};
