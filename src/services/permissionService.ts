import * as rolePermissionModel from '../models/rolePermissionModel';
import { UserRole, PermissionAction } from '../models/rolePermissionModel';
import redis from '../config/redis';
import logger from '../utils/logger';

const CACHE_TTL_SECONDS = 300; // 5 menit

// Ambil matriks izin lengkap untuk satu role
export const getPermissionMatrix = async (role: UserRole) => {
  try {
    const [permissions, modules] = await Promise.all([
      rolePermissionModel.findByRole(role),
      rolePermissionModel.findAllModules(),
    ]);

    // Bentuk matriks: { module_slug: { action: allowed } }
    const matrix: Record<string, Record<string, boolean>> = {};

    for (const mod of modules) {
      matrix[mod.slug] = {
        read: false, create: false, edit: false, delete: false,
        export: false, approve: false, pay: false, settings: false,
      };
    }

    for (const perm of permissions) {
      if (matrix[perm.module_slug]) {
        matrix[perm.module_slug][perm.action] = perm.allowed;
      }
    }

    return { role, modules, matrix };
  } catch (error) {
    logger.error('Error in permissionService.getPermissionMatrix', error);
    throw error;
  }
};

// Update satu izin dan invalidasi cache Redis
export const updatePermission = async (
  role: UserRole,
  moduleSlug: string,
  action: PermissionAction,
  allowed: boolean
) => {
  try {
    await rolePermissionModel.upsertPermission(role, moduleSlug, action, allowed);

    // Invalidasi cache Redis untuk izin ini
    const cacheKey = `perm:${role}:${moduleSlug}:${action}`;
    await redis.del(cacheKey);

    logger.info(`Permission updated and cache invalidated: ${cacheKey} = ${allowed}`);
  } catch (error) {
    logger.error('Error in permissionService.updatePermission', error);
    throw error;
  }
};

// Invalidasi semua cache untuk satu role (batch update)
export const invalidateRoleCache = async (role: UserRole) => {
  try {
    const keys = await redis.keys(`perm:${role}:*`);
    if (keys.length > 0) {
      await redis.del(...keys);
      logger.info(`Invalidated ${keys.length} cache keys for role '${role}'`);
    }
  } catch (error) {
    logger.error('Error in permissionService.invalidateRoleCache', error);
    throw error;
  }
};
