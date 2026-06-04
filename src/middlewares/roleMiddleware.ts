import { Response, NextFunction } from "express";
import { AuthRequest } from "./authMiddleware";
import { PermissionAction, UserRole } from "../models/rolePermissionModel";
import * as rolePermissionModel from "../models/rolePermissionModel";
import redis from "../config/redis";
import logger from "../utils/logger";
import { formatError } from "../utils/responseFormatter";

const CACHE_TTL_SECONDS = 300; // 5 menit

/**
 * Middleware RBAC dinamis — mengecek izin berdasarkan role dan modul.
 * Menggunakan Redis untuk cache agar tidak query DB setiap request.
 *
 * Harus dipanggil setelah `authenticateToken`.
 *
 * @param moduleSlug  Slug modul, contoh: 'pos', 'pelanggan', 'produk'
 * @param action      Aksi yang dibutuhkan, contoh: 'read', 'create', 'delete'
 */
export const authorizePermission = (
  moduleSlug: string,
  action: PermissionAction,
) => {
  return async (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    if (!req.user) {
      logger.warn("authorizePermission: req.user is undefined");
      res
        .status(401)
        .json(formatError("Access denied. User not authenticated."));
      return;
    }

    const role = req.user.role as UserRole;
    const cacheKey = `perm:${role}:${moduleSlug}:${action}`;

    try {
      // Cek Redis cache terlebih dahulu
      const cached = await redis.get(cacheKey);

      if (cached !== null) {
        if (cached === "1") {
          next();
          return;
        }
        logger.warn(
          `Permission denied (cache): role='${role}', module='${moduleSlug}', action='${action}'`,
        );
        res
          .status(403)
          .json(formatError("Access denied. Insufficient permissions."));
        return;
      }

      // Cache miss — query database
      const allowed = await rolePermissionModel.checkPermission(
        role,
        moduleSlug,
        action,
      );

      // Simpan hasil ke Redis dengan TTL 5 menit
      await redis.set(cacheKey, allowed ? "1" : "0", "EX", CACHE_TTL_SECONDS);

      if (allowed) {
        next();
        return;
      }

      logger.warn(
        `Permission denied (db): role='${role}', module='${moduleSlug}', action='${action}'`,
      );
      res
        .status(403)
        .json(formatError("Access denied. Insufficient permissions."));
    } catch (err) {
      logger.error("authorizePermission error", err);
      res
        .status(500)
        .json(formatError("Internal server error during authorization."));
    }
  };
};

export // Middleware tambahan untuk memastikan hanya superadmin yang dapat melakukan modifikasi data user
const requireSuperadmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  if (req.user?.role !== "superadmin") {
    res
      .status(403)
      .json(formatError("Hanya superadmin yang diizinkan melakukan aksi ini."));
    return;
  }
  next();
};
