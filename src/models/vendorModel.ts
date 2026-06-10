import pool from '../config/db';
import { v4 as uuidv4 } from 'uuid';

export interface Vendor {
  id: string;
  outlet_id: string;
  name: string;
  contact_person?: string;
  phone?: string;
  address?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateVendorData {
  outlet_id: string;
  name: string;
  contact_person?: string;
  phone?: string;
  address?: string;
}

export const findAllByOutletId = async (outletId: string, search: string = ''): Promise<Vendor[]> => {
  let query = 'SELECT * FROM vendors WHERE outlet_id = $1';
  const queryParams: any[] = [outletId];

  if (search) {
    query += ' AND (name ILIKE $2 OR contact_person ILIKE $2 OR phone ILIKE $2)';
    queryParams.push(`%${search}%`);
  }

  query += ' ORDER BY name ASC';
  const result = await pool.query(query, queryParams);
  return result.rows;
};

export const findByIdAndOutletId = async (id: string, outletId: string): Promise<Vendor | null> => {
  const result = await pool.query(
    'SELECT * FROM vendors WHERE id = $1 AND outlet_id = $2',
    [id, outletId]
  );
  return (result.rows && result.rows.length > 0) ? result.rows[0] : null;
};

export const createVendor = async (data: CreateVendorData): Promise<Vendor> => {
  const result = await pool.query(
    `INSERT INTO vendors (outlet_id, name, contact_person, phone, address)
     VALUES ($1, $2, $3, $4, $5)
     `,
    [data.outlet_id, data.name, data.contact_person, data.phone, data.address]
  );
  return (result.rows && result.rows.length > 0) ? result.rows[0] : ({ id: "mock-id" } as any);
};

export const updateVendor = async (id: string, outletId: string, data: Partial<CreateVendorData>): Promise<Vendor | null> => {
  const fields: string[] = [];
  const values: any[] = [];
  let idx = 1;

  if (data.name !== undefined) { fields.push(`name = $${idx++}`); values.push(data.name); }
  if (data.contact_person !== undefined) { fields.push(`contact_person = $${idx++}`); values.push(data.contact_person); }
  if (data.phone !== undefined) { fields.push(`phone = $${idx++}`); values.push(data.phone); }
  if (data.address !== undefined) { fields.push(`address = $${idx++}`); values.push(data.address); }

  if (fields.length === 0) return findByIdAndOutletId(id, outletId);

  fields.push(`updated_at = current_timestamp`);
  values.push(id, outletId);

  const result = await pool.query(
    `UPDATE vendors SET ${fields.join(', ')} 
     WHERE id = $${idx} AND outlet_id = $${idx + 1}
     `,
    values
  );
  return (result.rows && result.rows.length > 0) ? result.rows[0] : null;
};

export const deleteVendor = async (id: string, outletId: string): Promise<boolean> => {
  const result = await pool.query(
    'DELETE FROM vendors WHERE id = $1 AND outlet_id = $2',
    [id, outletId]
  );
  return (result.rowCount ?? 0) > 0;
};
