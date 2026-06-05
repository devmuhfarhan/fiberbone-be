import pool from '../config/db';

export interface Customer {
  id: string;
  outlet_id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  receivable_balance: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateCustomerData {
  outlet_id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface UpdateCustomerData {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  receivable_balance?: number;
}

export const findAllByOutletId = async (outletId: string, search: string = ''): Promise<Customer[]> => {
  let query = 'SELECT * FROM customers WHERE outlet_id = $1';
  const queryParams: any[] = [outletId];

  if (search) {
    query += ' AND (name ILIKE $2 OR email ILIKE $2 OR phone ILIKE $2)';
    queryParams.push(`%${search}%`);
  }

  query += ' ORDER BY name ASC';
  const result = await pool.query(query, queryParams);
  return result.rows;
};

export const findByIdAndOutletId = async (id: string, outletId: string): Promise<Customer | null> => {
  const result = await pool.query(
    'SELECT * FROM customers WHERE id = $1 AND outlet_id = $2',
    [id, outletId]
  );
  return result.rows[0] || null;
};

export const createCustomer = async (data: CreateCustomerData): Promise<Customer> => {
  const result = await pool.query(
    `INSERT INTO customers (outlet_id, name, email, phone, address)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [data.outlet_id, data.name, data.email, data.phone, data.address]
  );
  return result.rows[0];
};

export const updateCustomer = async (id: string, outletId: string, data: UpdateCustomerData, client: any = pool): Promise<Customer | null> => {
  const fields: string[] = [];
  const values: any[] = [];
  let idx = 1;

  if (data.name !== undefined) { fields.push(`name = $${idx++}`); values.push(data.name); }
  if (data.email !== undefined) { fields.push(`email = $${idx++}`); values.push(data.email); }
  if (data.phone !== undefined) { fields.push(`phone = $${idx++}`); values.push(data.phone); }
  if (data.address !== undefined) { fields.push(`address = $${idx++}`); values.push(data.address); }
  if (data.receivable_balance !== undefined) { fields.push(`receivable_balance = $${idx++}`); values.push(data.receivable_balance); }

  if (fields.length === 0) return findByIdAndOutletId(id, outletId);

  fields.push(`updated_at = current_timestamp`);
  values.push(id, outletId);

  const result = await client.query(
    `UPDATE customers SET ${fields.join(', ')} 
     WHERE id = $${idx} AND outlet_id = $${idx + 1} RETURNING *`,
    values
  );
  return result.rows[0] || null;
};

export const deleteCustomer = async (id: string, outletId: string): Promise<boolean> => {
  const result = await pool.query(
    'DELETE FROM customers WHERE id = $1 AND outlet_id = $2',
    [id, outletId]
  );
  return (result.rowCount ?? 0) > 0;
};
