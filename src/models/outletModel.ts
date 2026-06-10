import pool from '../config/db';
import { v4 as uuidv4 } from 'uuid';

export interface Outlet {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  logo_url?: string;
  description?: string;
  receipt_footer?: string;
  owner_id: string;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface CreateOutletData {
  name: string;
  address?: string;
  phone?: string;
  logo_url?: string;
  description?: string;
  receipt_footer?: string;
  owner_id: string;
}

// Ambil semua outlet (untuk superadmin)
export const findAll = async (search: string = ''): Promise<Outlet[]> => {
  let query = 'SELECT id, name, address, phone, logo_url, description, receipt_footer, owner_id, is_active, created_at, updated_at FROM outlets';
  const queryParams: any[] = [];

  if (search) {
    query += ' WHERE name ILIKE $1 OR address ILIKE $1';
    queryParams.push(`%${search}%`);
  }

  query += ' ORDER BY created_at DESC';
  const result = await pool.query(query, queryParams);
  return result.rows;
};

// Ambil outlet berdasarkan ID
export const findById = async (id: string): Promise<Outlet | null> => {
  const result = await pool.query(
    'SELECT id, name, address, phone, logo_url, description, receipt_footer, owner_id, is_active, created_at, updated_at FROM outlets WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
};

// Ambil outlet milik superadmin tertentu (owner)
export const findByOwnerId = async (ownerId: string, search: string = ''): Promise<Outlet[]> => {
  let query = 'SELECT id, name, address, phone, logo_url, description, receipt_footer, owner_id, is_active, created_at, updated_at FROM outlets WHERE owner_id = $1';
  const queryParams: any[] = [ownerId];

  if (search) {
    query += ' AND (name ILIKE $2 OR address ILIKE $2)';
    queryParams.push(`%${search}%`);
  }

  query += ' ORDER BY created_at DESC';
  const result = await pool.query(query, queryParams);
  return result.rows;
};

// Ambil outlet yang bisa diakses oleh user non-superadmin (via outlet_users)
export const findByUserId = async (userId: string): Promise<Outlet | null> => {
  const result = await pool.query(
    `SELECT o.id, o.name, o.address, o.phone, o.logo_url, o.description, o.receipt_footer, o.owner_id, o.is_active, o.created_at, o.updated_at
     FROM outlets o
     INNER JOIN outlet_users ou ON ou.outlet_id = o.id
     WHERE ou.user_id = $1 AND o.is_active = true
     LIMIT 1`,
    [userId]
  );
  return result.rows[0] || null;
};

// Buat outlet baru
export const createOutlet = async (data: CreateOutletData): Promise<Outlet> => {
  const id = uuidv4();
  await pool.query(
    `INSERT INTO outlets (id, name, address, phone, logo_url, description, receipt_footer, owner_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     `,
    [
      id,
      data.name,
      data.address || null,
      data.phone || null,
      data.logo_url || null,
      data.description || null,
      data.receipt_footer || null,
      data.owner_id
    ]
  );
  return (await findById(id)) as Outlet;
};

// Update outlet
export const updateOutlet = async (id: string, data: Partial<CreateOutletData>): Promise<Outlet | null> => {
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (data.name !== undefined) { fields.push(`name = $${idx++}`); values.push(data.name); }
  if (data.address !== undefined) { fields.push(`address = $${idx++}`); values.push(data.address); }
  if (data.phone !== undefined) { fields.push(`phone = $${idx++}`); values.push(data.phone); }
  if (data.logo_url !== undefined) { fields.push(`logo_url = $${idx++}`); values.push(data.logo_url); }
  if (data.description !== undefined) { fields.push(`description = $${idx++}`); values.push(data.description); }
  if (data.receipt_footer !== undefined) { fields.push(`receipt_footer = $${idx++}`); values.push(data.receipt_footer); }

  if (fields.length === 0) return findById(id);

  fields.push(`updated_at = current_timestamp`);
  values.push(id);

  await pool.query(
    `UPDATE outlets SET ${fields.join(', ')} WHERE id = $${idx}
     `,
    values
  );
  return findById(id);
};
