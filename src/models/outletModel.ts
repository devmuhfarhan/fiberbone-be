import pool from '../config/db';

export interface Outlet {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  logo_url?: string;
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
  owner_id: string;
}

// Ambil semua outlet (untuk superadmin)
export const findAll = async (): Promise<Outlet[]> => {
  const result = await pool.query(
    'SELECT id, name, address, phone, logo_url, owner_id, is_active, created_at, updated_at FROM outlets ORDER BY created_at DESC'
  );
  return result.rows;
};

// Ambil outlet berdasarkan ID
export const findById = async (id: string): Promise<Outlet | null> => {
  const result = await pool.query(
    'SELECT id, name, address, phone, logo_url, owner_id, is_active, created_at, updated_at FROM outlets WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
};

// Ambil outlet milik superadmin tertentu (owner)
export const findByOwnerId = async (ownerId: string): Promise<Outlet[]> => {
  const result = await pool.query(
    'SELECT id, name, address, phone, logo_url, owner_id, is_active, created_at, updated_at FROM outlets WHERE owner_id = $1 ORDER BY created_at DESC',
    [ownerId]
  );
  return result.rows;
};

// Ambil outlet yang bisa diakses oleh user non-superadmin (via outlet_users)
export const findByUserId = async (userId: string): Promise<Outlet | null> => {
  const result = await pool.query(
    `SELECT o.id, o.name, o.address, o.phone, o.logo_url, o.owner_id, o.is_active, o.created_at, o.updated_at
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
  const result = await pool.query(
    `INSERT INTO outlets (name, address, phone, logo_url, owner_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, name, address, phone, logo_url, owner_id, is_active, created_at, updated_at`,
    [data.name, data.address || null, data.phone || null, data.logo_url || null, data.owner_id]
  );
  return result.rows[0];
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

  if (fields.length === 0) return findById(id);

  fields.push(`updated_at = current_timestamp`);
  values.push(id);

  const result = await pool.query(
    `UPDATE outlets SET ${fields.join(', ')} WHERE id = $${idx}
     RETURNING id, name, address, phone, logo_url, owner_id, is_active, created_at, updated_at`,
    values
  );
  return result.rows[0] || null;
};
