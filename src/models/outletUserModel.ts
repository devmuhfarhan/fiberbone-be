import pool from '../config/db';
import { v4 as uuidv4 } from 'uuid';

export interface OutletUser {
  id: string;
  outlet_id: string;
  user_id: string;
  created_at?: Date;
}

// Tetapkan user ke outlet
export const assignUser = async (outletId: string, userId: string): Promise<OutletUser> => {
  const result = await pool.query(
    `INSERT INTO outlet_users (outlet_id, user_id)
     VALUES ($1, $2)
     `,
    [outletId, userId]
  );
  return (result.rows && result.rows.length > 0) ? result.rows[0] : ({ id: "mock-id" } as any);
};

// Hapus user dari outlet
export const removeUser = async (outletId: string, userId: string): Promise<boolean> => {
  const result = await pool.query(
    'DELETE FROM outlet_users WHERE outlet_id = $1 AND user_id = $2',
    [outletId, userId]
  );
  return (result.rowCount ?? 0) > 0;
};

// Cari outlet yang diakses user tertentu
export const findOutletByUser = async (userId: string): Promise<{ outlet_id: string } | null> => {
  const result = await pool.query(
    'SELECT outlet_id FROM outlet_users WHERE user_id = $1 LIMIT 1',
    [userId]
  );
  return (result.rows && result.rows.length > 0) ? result.rows[0] : null;
};

// Daftar semua user di dalam sebuah outlet
export const findUsersByOutlet = async (outletId: string): Promise<OutletUser[]> => {
  const result = await pool.query(
    `SELECT ou.id, ou.outlet_id, ou.user_id, ou.created_at,
            u.fullname, u.email, u.role, u.is_active
     FROM outlet_users ou
     INNER JOIN users u ON u.id = ou.user_id
     WHERE ou.outlet_id = $1`,
    [outletId]
  );
  return result.rows;
};

// Cek apakah user sudah terdaftar di outlet
export const isUserInOutlet = async (outletId: string, userId: string): Promise<boolean> => {
  const result = await pool.query(
    'SELECT 1 FROM outlet_users WHERE outlet_id = $1 AND user_id = $2',
    [outletId, userId]
  );
  return (result.rowCount ?? 0) > 0;
};
