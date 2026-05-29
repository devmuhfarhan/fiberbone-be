import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger';
import { UserRole } from '../models/rolePermissionModel';
import * as outletUserModel from '../models/outletUserModel';

export interface AuthUser {
  id: string;
  role: UserRole;
  outlet_id: string | null; // null untuk superadmin (bisa akses semua outlet)
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const token = req.cookies?.accessToken;

  if (!token) {
    logger.warn('Unauthorized access attempt without token');
    res.status(401).json({ message: 'Access denied. No token provided.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string; role: UserRole };

    let outletId: string | null = null;

    if (decoded.role === 'superadmin') {
      // Superadmin: outlet aktif dikirim via header dari frontend (localStorage)
      // Frontend set: localStorage.setItem('activeOutletId', id)
      // Lalu tiap request: headers['X-Active-Outlet-Id'] = localStorage.getItem('activeOutletId')
      const headerOutletId = req.headers['x-active-outlet-id'];
      outletId = typeof headerOutletId === 'string' ? headerOutletId : null;
    } else {
      // Non-superadmin: outlet_id sudah fixed, ambil dari DB
      const outletUser = await outletUserModel.findOutletByUser(decoded.id);
      outletId = outletUser?.outlet_id ?? null;
    }

    req.user = {
      id: decoded.id,
      role: decoded.role,
      outlet_id: outletId,
    };

    next();
  } catch (err) {
    logger.error('Invalid token', err);
    res.status(403).json({ message: 'Invalid or expired token.' });
  }
};
