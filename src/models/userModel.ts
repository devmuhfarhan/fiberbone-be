import pool from '../config/db';

export interface User {
  id: string;
  fullname: string;
  email: string;
  password?: string;
  is_active: boolean;
  role: 'superadmin' | 'cashier' | 'finance' | 'operational';
  created_at?: Date;
  updated_at?: Date;
}

// Template fungsi query ke database (contoh: Get all users dengan pagination)
export const findAll = async (limit: number, offset: number): Promise<{ users: User[], total: number }> => {
  const countResult = await pool.query('SELECT COUNT(*) FROM users');
  const total = parseInt(countResult.rows[0].count, 10);

  const result = await pool.query('SELECT id, fullname, email, is_active, role, created_at, updated_at FROM users LIMIT $1 OFFSET $2', [limit, offset]);
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
