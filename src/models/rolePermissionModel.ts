import pool from '../config/db';
import { v4 as uuidv4 } from 'uuid';

export type PermissionAction = 'read' | 'create' | 'edit' | 'delete' | 'export' | 'approve' | 'pay' | 'settings';
export type UserRole = 'superadmin' | 'cashier' | 'finance' | 'operational';

export interface RolePermission {
  id: number;
  role: UserRole;
  module_id: number;
  module_slug: string;
  module_name: string;
  action: PermissionAction;
  allowed: boolean;
}

// Ambil semua izin untuk satu role (digunakan untuk cache Redis)
export const findByRole = async (role: UserRole): Promise<RolePermission[]> => {
  const result = await pool.query(
    `SELECT rp.id, rp.role, rp.module_id, m.slug AS module_slug, m.name AS module_name, rp.action, rp.allowed
     FROM role_permissions rp
     INNER JOIN modules m ON m.id = rp.module_id
     WHERE rp.role = $1`,
    [role]
  );
  return result.rows;
};

// Cek satu izin spesifik (role + modul + aksi)
export const checkPermission = async (
  role: UserRole,
  moduleSlug: string,
  action: PermissionAction
): Promise<boolean> => {
  const result = await pool.query(
    `SELECT rp.allowed
     FROM role_permissions rp
     INNER JOIN modules m ON m.id = rp.module_id
     WHERE rp.role = $1 AND m.slug = $2 AND rp.action = $3`,
    [role, moduleSlug, action]
  );
  return result.rows[0]?.allowed ?? false;
};

// Update (upsert) izin — digunakan dari admin dashboard
export const upsertPermission = async (
  role: UserRole,
  moduleSlug: string,
  action: PermissionAction,
  allowed: boolean
): Promise<void> => {
  await pool.query(
    `INSERT INTO role_permissions (role, module_id, action, allowed)
     SELECT $1, m.id, $2, $3
     FROM modules m WHERE m.slug = $4
     ON DUPLICATE KEY UPDATE allowed = VALUES(allowed)`,
    [role, action, allowed, moduleSlug]
  );
};

// Ambil semua modul (untuk membangun UI matriks)
export const findAllModules = async (): Promise<{ id: number; name: string; slug: string }[]> => {
  const result = await pool.query('SELECT id, name, slug FROM modules ORDER BY id');
  return result.rows;
};
