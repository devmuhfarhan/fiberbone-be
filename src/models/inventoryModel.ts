import pool from '../config/db';

export type InventoryTransactionType = 'IN' | 'OUT' | 'OPNAME';

export interface InventoryBatch {
  id: string;
  outlet_id: string;
  product_id: string;
  quantity: number;
  quantity_available: number;
  unit_cost: number;
  batch_date: Date;
  created_at: Date;
  updated_at: Date;
}

export interface InventoryTransaction {
  id: string;
  outlet_id: string;
  product_id: string;
  type: InventoryTransactionType;
  quantity: number;
  total_cost: number;
  reference_type?: string;
  reference_id?: string;
  notes?: string;
  created_at: Date;
}

export const getBatchesByProductId = async (outletId: string, productId: string): Promise<InventoryBatch[]> => {
  const result = await pool.query(
    'SELECT * FROM inventory_batches WHERE outlet_id = $1 AND product_id = $2 ORDER BY batch_date ASC, created_at ASC',
    [outletId, productId]
  );
  return result.rows;
};

export const getAvailableBatchesByProductId = async (outletId: string, productId: string, client: any = pool): Promise<InventoryBatch[]> => {
  const result = await client.query(
    'SELECT * FROM inventory_batches WHERE outlet_id = $1 AND product_id = $2 AND quantity_available > 0 ORDER BY batch_date ASC, created_at ASC',
    [outletId, productId]
  );
  return result.rows;
};

export const getTransactionsByProductId = async (outletId: string, productId: string): Promise<InventoryTransaction[]> => {
  const result = await pool.query(
    'SELECT * FROM inventory_transactions WHERE outlet_id = $1 AND product_id = $2 ORDER BY created_at DESC',
    [outletId, productId]
  );
  return result.rows;
};

export const createBatch = async (data: Partial<InventoryBatch>, client: any = pool): Promise<InventoryBatch> => {
  const result = await client.query(
    `INSERT INTO inventory_batches (outlet_id, product_id, quantity, quantity_available, unit_cost)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [data.outlet_id, data.product_id, data.quantity, data.quantity_available, data.unit_cost]
  );
  return result.rows[0];
};

export const updateBatchQuantity = async (id: string, quantity_available: number, client: any = pool): Promise<void> => {
  await client.query(
    'UPDATE inventory_batches SET quantity_available = $1, updated_at = current_timestamp WHERE id = $2',
    [quantity_available, id]
  );
};

export const createTransaction = async (data: Partial<InventoryTransaction>, client: any = pool): Promise<InventoryTransaction> => {
  const result = await client.query(
    `INSERT INTO inventory_transactions (outlet_id, product_id, type, quantity, total_cost, reference_type, reference_id, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [data.outlet_id, data.product_id, data.type, data.quantity, data.total_cost, data.reference_type, data.reference_id, data.notes]
  );
  return result.rows[0];
};

export const updateProductStock = async (productId: string, outletId: string, newStock: number, client: any = pool): Promise<void> => {
  await client.query(
    'UPDATE products SET stock = $1, updated_at = current_timestamp WHERE id = $2 AND outlet_id = $3',
    [newStock, productId, outletId]
  );
};

export const getProductStock = async (productId: string, outletId: string, client: any = pool): Promise<number> => {
  const result = await client.query(
    'SELECT stock FROM products WHERE id = $1 AND outlet_id = $2',
    [productId, outletId]
  );
  return result.rows[0]?.stock || 0;
};
