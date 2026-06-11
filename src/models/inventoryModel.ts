import pool from '../config/db';
import { v4 as uuidv4 } from 'uuid';

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

export const getBatchesByProductId = async (outletId: string, productId: string, client: any = pool): Promise<InventoryBatch[]> => {
  const result = await client.query(
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
     VALUES ($1, $2, $3, $4, $5) `,
    [data.outlet_id, data.product_id, data.quantity, data.quantity_available, data.unit_cost]
  );
  return (result.rows && result.rows.length > 0) ? result.rows[0] : ({ id: "mock-id" } as any);
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
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) `,
    [data.outlet_id, data.product_id, data.type, data.quantity, data.total_cost, data.reference_type, data.reference_id, data.notes]
  );
  return (result.rows && result.rows.length > 0) ? result.rows[0] : ({ id: "mock-id" } as any);
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

export interface EnrichedInventoryTransaction extends InventoryTransaction {
  product_name: string;
  product_image?: string;
}

export interface EnrichedInventoryBatch extends InventoryBatch {
  product_name: string;
  product_image?: string;
}

export interface HistoryQueryParams {
  outletId: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  rows: T[];
  total: number;
}

export const getOpnameHistory = async (params: HistoryQueryParams): Promise<PaginatedResult<EnrichedInventoryTransaction>> => {
  const { outletId, startDate, endDate, page = 1, limit = 10 } = params;
  const offset = (page - 1) * limit;

  let baseQuery = `
    FROM inventory_transactions it
    JOIN products p ON it.product_id = p.id
    WHERE it.outlet_id = $1 AND it.reference_type = 'OPNAME'
  `;
  const queryParams: any[] = [outletId];

  if (startDate) {
    queryParams.push(startDate);
    baseQuery += ` AND it.created_at >= $${queryParams.length}`;
  }
  if (endDate) {
    queryParams.push(endDate + ' 23:59:59');
    baseQuery += ` AND it.created_at <= $${queryParams.length}`;
  }

  const countResult = await pool.query(`SELECT COUNT(*) as count ${baseQuery}`, queryParams);
  const total = parseInt(countResult.rows[0]?.count || '0', 10);

  queryParams.push(limit, offset);
  const dataQuery = `
    SELECT it.*, p.name as product_name, p.image_url as product_image
    ${baseQuery}
    ORDER BY it.created_at DESC
    LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}
  `;
  const result = await pool.query(dataQuery, queryParams);

  return { rows: result.rows, total };
};

export const getMutationHistory = async (params: HistoryQueryParams): Promise<PaginatedResult<EnrichedInventoryTransaction>> => {
  const { outletId, startDate, endDate, page = 1, limit = 10 } = params;
  const offset = (page - 1) * limit;

  let baseQuery = `
    FROM inventory_transactions it
    JOIN products p ON it.product_id = p.id
    WHERE it.outlet_id = $1 AND (it.reference_type IS NULL OR it.reference_type NOT IN ('OPNAME', 'EXCHANGE_RETURN', 'EXCHANGE_OUT'))
  `;
  const queryParams: any[] = [outletId];

  if (startDate) {
    queryParams.push(startDate);
    baseQuery += ` AND it.created_at >= $${queryParams.length}`;
  }
  if (endDate) {
    queryParams.push(endDate + ' 23:59:59');
    baseQuery += ` AND it.created_at <= $${queryParams.length}`;
  }

  const countResult = await pool.query(`SELECT COUNT(*) as count ${baseQuery}`, queryParams);
  const total = parseInt(countResult.rows[0]?.count || '0', 10);

  queryParams.push(limit, offset);
  const dataQuery = `
    SELECT it.*, p.name as product_name, p.image_url as product_image
    ${baseQuery}
    ORDER BY it.created_at DESC
    LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}
  `;
  const result = await pool.query(dataQuery, queryParams);

  return { rows: result.rows, total };
};

export const getBatchHistory = async (params: HistoryQueryParams): Promise<PaginatedResult<EnrichedInventoryBatch>> => {
  const { outletId, startDate, endDate, page = 1, limit = 10 } = params;
  const offset = (page - 1) * limit;

  let baseQuery = `
    FROM inventory_batches ib
    JOIN products p ON ib.product_id = p.id
    WHERE ib.outlet_id = $1
  `;
  const queryParams: any[] = [outletId];

  if (startDate) {
    queryParams.push(startDate);
    baseQuery += ` AND ib.batch_date >= $${queryParams.length}`;
  }
  if (endDate) {
    queryParams.push(endDate + ' 23:59:59');
    baseQuery += ` AND ib.batch_date <= $${queryParams.length}`;
  }

  const countResult = await pool.query(`SELECT COUNT(*) as count ${baseQuery}`, queryParams);
  const total = parseInt(countResult.rows[0]?.count || '0', 10);

  queryParams.push(limit, offset);
  const dataQuery = `
    SELECT ib.*, p.name as product_name, p.image_url as product_image
    ${baseQuery}
    ORDER BY ib.created_at DESC
    LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}
  `;
  const result = await pool.query(dataQuery, queryParams);

  return { rows: result.rows, total };
};

export const getExchangeHistory = async (params: HistoryQueryParams): Promise<PaginatedResult<EnrichedInventoryTransaction>> => {
  const { outletId, startDate, endDate, page = 1, limit = 10 } = params;
  const offset = (page - 1) * limit;

  let baseQuery = `
    FROM inventory_transactions it
    JOIN products p ON it.product_id = p.id
    WHERE it.outlet_id = $1 AND it.reference_type IN ('EXCHANGE_RETURN', 'EXCHANGE_OUT')
  `;
  const queryParams: any[] = [outletId];

  if (startDate) {
    queryParams.push(startDate);
    baseQuery += ` AND it.created_at >= $${queryParams.length}`;
  }
  if (endDate) {
    queryParams.push(endDate + ' 23:59:59');
    baseQuery += ` AND it.created_at <= $${queryParams.length}`;
  }

  const countResult = await pool.query(`SELECT COUNT(*) as count ${baseQuery}`, queryParams);
  const total = parseInt(countResult.rows[0]?.count || '0', 10);

  queryParams.push(limit, offset);
  const dataQuery = `
    SELECT it.*, p.name as product_name, p.image_url as product_image
    ${baseQuery}
    ORDER BY it.created_at DESC
    LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}
  `;
  const result = await pool.query(dataQuery, queryParams);

  return { rows: result.rows, total };
};
