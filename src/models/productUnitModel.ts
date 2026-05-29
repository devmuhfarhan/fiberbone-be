import pool from '../config/db';

export interface ProductUnit {
  id: string;
  outlet_id: string;
  name: string;
  abbreviation?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface CreateProductUnitData {
  outlet_id: string;
  name: string;
  abbreviation?: string;
}

export const findAllByOutlet = async (outletId: string): Promise<ProductUnit[]> => {
  const result = await pool.query(
    'SELECT id, outlet_id, name, abbreviation, created_at, updated_at FROM product_units WHERE outlet_id = $1 ORDER BY name ASC',
    [outletId]
  );
  return result.rows;
};

export const findById = async (id: string, outletId: string): Promise<ProductUnit | null> => {
  const result = await pool.query(
    'SELECT id, outlet_id, name, abbreviation, created_at, updated_at FROM product_units WHERE id = $1 AND outlet_id = $2',
    [id, outletId]
  );
  return result.rows[0] || null;
};

export const create = async (data: CreateProductUnitData): Promise<ProductUnit> => {
  const result = await pool.query(
    `INSERT INTO product_units (outlet_id, name, abbreviation)
     VALUES ($1, $2, $3)
     RETURNING id, outlet_id, name, abbreviation, created_at, updated_at`,
    [data.outlet_id, data.name, data.abbreviation || null]
  );
  return result.rows[0];
};

export const update = async (
  id: string,
  outletId: string,
  data: { name?: string; abbreviation?: string }
): Promise<ProductUnit | null> => {
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (data.name !== undefined) { fields.push(`name = $${idx++}`); values.push(data.name); }
  if (data.abbreviation !== undefined) { fields.push(`abbreviation = $${idx++}`); values.push(data.abbreviation); }

  if (fields.length === 0) return findById(id, outletId);

  fields.push('updated_at = current_timestamp');
  values.push(id, outletId);

  const result = await pool.query(
    `UPDATE product_units SET ${fields.join(', ')}
     WHERE id = $${idx++} AND outlet_id = $${idx}
     RETURNING id, outlet_id, name, abbreviation, created_at, updated_at`,
    values
  );
  return result.rows[0] || null;
};

export const remove = async (id: string, outletId: string): Promise<boolean> => {
  const result = await pool.query(
    'DELETE FROM product_units WHERE id = $1 AND outlet_id = $2',
    [id, outletId]
  );
  return (result.rowCount ?? 0) > 0;
};
