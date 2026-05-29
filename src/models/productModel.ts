import pool from '../config/db';

export interface Product {
  id: string;
  outlet_id: string;
  category_id?: string | null;
  unit_id?: string | null;
  name: string;
  description?: string | null;
  price: number;
  cost_price?: number | null;
  stock: number;
  min_stock: number;
  image_url?: string | null;
  is_active: boolean;
  // join fields
  category_name?: string;
  unit_name?: string;
  unit_abbreviation?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface CreateProductData {
  outlet_id: string;
  category_id?: string | null;
  unit_id?: string | null;
  name: string;
  description?: string | null;
  price: number;
  cost_price?: number | null;
  stock?: number;
  min_stock?: number;
  image_url?: string | null;
}

const BASE_SELECT = `
  p.id, p.outlet_id, p.category_id, p.unit_id,
  p.name, p.description, p.price, p.cost_price,
  p.stock, p.min_stock, p.image_url, p.is_active,
  p.created_at, p.updated_at,
  c.name AS category_name,
  u.name AS unit_name,
  u.abbreviation AS unit_abbreviation
`;

const BASE_JOIN = `
  FROM products p
  LEFT JOIN product_categories c ON c.id = p.category_id
  LEFT JOIN product_units u ON u.id = p.unit_id
`;

export const findAllByOutlet = async (
  outletId: string,
  limit: number,
  offset: number,
  search?: string
): Promise<{ products: Product[]; total: number }> => {
  const conditions = ['p.outlet_id = $1'];
  const values: unknown[] = [outletId];
  let idx = 2;

  if (search) {
    conditions.push(`p.name ILIKE $${idx++}`);
    values.push(`%${search}%`);
  }

  const where = `WHERE ${conditions.join(' AND ')}`;

  const countResult = await pool.query(
    `SELECT COUNT(*) ${BASE_JOIN} ${where}`,
    values
  );
  const total = parseInt(countResult.rows[0].count, 10);

  const result = await pool.query(
    `SELECT ${BASE_SELECT} ${BASE_JOIN} ${where}
     ORDER BY p.name ASC LIMIT $${idx++} OFFSET $${idx}`,
    [...values, limit, offset]
  );

  return { products: result.rows, total };
};

export const findById = async (id: string, outletId: string): Promise<Product | null> => {
  const result = await pool.query(
    `SELECT ${BASE_SELECT} ${BASE_JOIN} WHERE p.id = $1 AND p.outlet_id = $2`,
    [id, outletId]
  );
  return result.rows[0] || null;
};

export const create = async (data: CreateProductData): Promise<Product> => {
  const result = await pool.query(
    `INSERT INTO products
       (outlet_id, category_id, unit_id, name, description, price, cost_price, stock, min_stock, image_url)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING id, outlet_id, category_id, unit_id, name, description,
               price, cost_price, stock, min_stock, image_url, is_active, created_at, updated_at`,
    [
      data.outlet_id,
      data.category_id ?? null,
      data.unit_id ?? null,
      data.name,
      data.description ?? null,
      data.price,
      data.cost_price ?? null,
      data.stock ?? 0,
      data.min_stock ?? 0,
      data.image_url ?? null,
    ]
  );
  return result.rows[0];
};

export const update = async (
  id: string,
  outletId: string,
  data: Partial<Omit<CreateProductData, 'outlet_id'>> & { is_active?: boolean }
): Promise<Product | null> => {
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  const updatable: (keyof typeof data)[] = [
    'category_id', 'unit_id', 'name', 'description',
    'price', 'cost_price', 'stock', 'min_stock', 'image_url', 'is_active',
  ];

  for (const key of updatable) {
    if (data[key] !== undefined) {
      fields.push(`${key} = $${idx++}`);
      values.push(data[key]);
    }
  }

  if (fields.length === 0) return findById(id, outletId);

  fields.push('updated_at = current_timestamp');
  values.push(id, outletId);

  const result = await pool.query(
    `UPDATE products SET ${fields.join(', ')}
     WHERE id = $${idx++} AND outlet_id = $${idx}
     RETURNING id, outlet_id, category_id, unit_id, name, description,
               price, cost_price, stock, min_stock, image_url, is_active, created_at, updated_at`,
    values
  );
  return result.rows[0] || null;
};

export const remove = async (id: string, outletId: string): Promise<boolean> => {
  const result = await pool.query(
    'DELETE FROM products WHERE id = $1 AND outlet_id = $2',
    [id, outletId]
  );
  return (result.rowCount ?? 0) > 0;
};
