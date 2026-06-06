import pool from '../config/db';

export interface User {
  id: string;
  fullname: string;
  email: string;
  password?: string;
  is_active: boolean;
  role: 'superadmin' | 'cashier' | 'finance' | 'operational';
  permissions?: Record<string, string[]>;
  created_at?: Date;
  updated_at?: Date;
}

// Template fungsi query ke database (contoh: Get all users dengan pagination)
export const findAll = async (limit: number, offset: number, search: string = ''): Promise<{ users: User[], total: number }> => {
  let countQuery = 'SELECT COUNT(*) FROM users';
  let dataQuery = 'SELECT id, fullname, email, is_active, role, created_at, updated_at FROM users';
  const queryParams: any[] = [];

  if (search) {
    countQuery += ' WHERE fullname ILIKE $1 OR email ILIKE $1';
    dataQuery += ' WHERE fullname ILIKE $1 OR email ILIKE $1';
    queryParams.push(`%${search}%`);
  }

  const countResult = await pool.query(countQuery, queryParams);
  const total = parseInt(countResult.rows[0].count, 10);

  dataQuery += ` ORDER BY created_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
  const result = await pool.query(dataQuery, [...queryParams, limit, offset]);
  
  return { users: result.rows, total };
};

// Template fungsi query get by ID
export const findById = async (id: string): Promise<User | null> => {
  const result = await pool.query('SELECT id, fullname, email, is_active, role, created_at, updated_at FROM users WHERE id = $1', [id]);
  return result.rows[0] || null;
};

// Template fungsi query get by email
export const findByEmail = async (email: string): Promise<User | null> => {
  const result = await pool.query('SELECT id, fullname, email, password, is_active, role, created_at, updated_at FROM users WHERE email = $1', [email]);
  return result.rows[0] || null;
};

// Template fungsi insert user baru
export const createUser = async (user: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> => {
  const result = await pool.query(
    'INSERT INTO users (fullname, email, password, is_active, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, fullname, email, is_active, role, created_at, updated_at',
    [user.fullname, user.email, user.password, user.is_active, user.role]
  );
  return result.rows[0];
};

export const updateUser = async (id: string, data: { fullname?: string; email?: string; role?: string }): Promise<User | null> => {
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (data.fullname !== undefined) { fields.push(`fullname = $${idx++}`); values.push(data.fullname); }
  if (data.email !== undefined) { fields.push(`email = $${idx++}`); values.push(data.email); }
  if (data.role !== undefined) { fields.push(`role = $${idx++}`); values.push(data.role); }

  if (fields.length === 0) return findById(id);

  fields.push(`updated_at = current_timestamp`);
  values.push(id);

  const result = await pool.query(
    `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx} RETURNING id, fullname, email, is_active, role, created_at, updated_at`,
    values
  );
  return result.rows[0] || null;
};

export const updateStatus = async (id: string, isActive: boolean): Promise<User | null> => {
  const result = await pool.query(
    `UPDATE users SET is_active = $1, updated_at = current_timestamp WHERE id = $2 RETURNING id, fullname, email, is_active, role, created_at, updated_at`,
    [isActive, id]
  );
  return result.rows[0] || null;
};

export const updatePassword = async (id: string, hashedPassword: string): Promise<boolean> => {
  const result = await pool.query(
    `UPDATE users SET password = $1, updated_at = current_timestamp WHERE id = $2`,
    [hashedPassword, id]
  );
  return (result.rowCount ?? 0) > 0;
};

export const deleteUser = async (id: string): Promise<boolean> => {
  const result = await pool.query(`DELETE FROM users WHERE id = $1`, [id]);
  return (result.rowCount ?? 0) > 0;
};
