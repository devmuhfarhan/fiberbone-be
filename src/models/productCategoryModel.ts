import pool from '../config/db';

export interface ProductCategory {
  id: string;
  outlet_id: string;
  name: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface CreateProductCategoryData {
  outlet_id: string;
  name: string;
}

export const findAllByOutlet = async (outletId: string, search: string = ''): Promise<ProductCategory[]> => {
  let query = 'SELECT id, outlet_id, name, created_at, updated_at FROM product_categories WHERE outlet_id = $1';
  const queryParams: any[] = [outletId];

  if (search) {
    query += ' AND name ILIKE $2';
    queryParams.push(`%${search}%`);
  }

  query += ' ORDER BY name ASC';
  const result = await pool.query(query, queryParams);
  return result.rows;
};

export const findById = async (id: string, outletId: string): Promise<ProductCategory | null> => {
  const result = await pool.query(
    'SELECT id, outlet_id, name, created_at, updated_at FROM product_categories WHERE id = $1 AND outlet_id = $2',
    [id, outletId]
  );
  return result.rows[0] || null;
};

export const create = async (data: CreateProductCategoryData): Promise<ProductCategory> => {
  const result = await pool.query(
    `INSERT INTO product_categories (outlet_id, name)
     VALUES ($1, $2)
     RETURNING id, outlet_id, name, created_at, updated_at`,
    [data.outlet_id, data.name]
  );
  return result.rows[0];
};

export const update = async (
  id: string,
  outletId: string,
  name: string
): Promise<ProductCategory | null> => {
  const result = await pool.query(
    `UPDATE product_categories
     SET name = $1, updated_at = current_timestamp
     WHERE id = $2 AND outlet_id = $3
     RETURNING id, outlet_id, name, created_at, updated_at`,
    [name, id, outletId]
  );
  return result.rows[0] || null;
};

export const remove = async (id: string, outletId: string): Promise<boolean> => {
  const result = await pool.query(
    'DELETE FROM product_categories WHERE id = $1 AND outlet_id = $2',
    [id, outletId]
  );
  return (result.rowCount ?? 0) > 0;
};
