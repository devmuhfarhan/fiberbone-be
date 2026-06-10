import pool from '../config/db';
import { v4 as uuidv4 } from 'uuid';

export interface Purchase {
  id: string;
  outlet_id: string;
  vendor_id: string;
  po_number: string;
  date: Date;
  status: 'OTW' | 'COMPLETED' | 'CANCELLED';
  payment_method: 'CASH' | 'TRANSFER' | 'HUTANG';
  payment_account_id?: string | null;
  total_amount: number;
  notes?: string | null;
  created_by?: string | null;
  created_at: Date;
  updated_at: Date;
  // Join fields
  vendor_name?: string;
  creator_name?: string;
  payment_account_name?: string;
}

export interface PurchaseItem {
  id: string;
  purchase_id: string;
  product_id: string;
  quantity_ordered: number;
  quantity_received: number;
  unit_cost: number;
  total_cost: number;
  // Join fields
  product_name?: string;
  product_sku?: string;
}

export interface CreatePurchaseData {
  outlet_id: string;
  vendor_id: string;
  po_number: string;
  date: string;
  payment_method: 'CASH' | 'TRANSFER' | 'HUTANG';
  payment_account_id?: string | null;
  total_amount: number;
  notes?: string | null;
  created_by?: string | null;
}

export interface CreatePurchaseItemData {
  product_id: string;
  quantity_ordered: number;
  unit_cost: number;
}

export const create = async (
  purchase: CreatePurchaseData,
  items: CreatePurchaseItemData[],
  client: any = pool
): Promise<Purchase> => {
  const result = await client.query(
    `INSERT INTO purchases 
       (outlet_id, vendor_id, po_number, date, payment_method, payment_account_id, total_amount, notes, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     `,
    [
      purchase.outlet_id,
      purchase.vendor_id,
      purchase.po_number,
      purchase.date,
      purchase.payment_method,
      purchase.payment_account_id ?? null,
      purchase.total_amount,
      purchase.notes ?? null,
      purchase.created_by ?? null,
    ]
  );
  
  const createdPurchase = result.rows[0];

  for (const item of items) {
    const totalCost = Number(item.quantity_ordered) * Number(item.unit_cost);
    await client.query(
      `INSERT INTO purchase_items 
         (purchase_id, product_id, quantity_ordered, unit_cost, total_cost)
       VALUES ($1, $2, $3, $4, $5)`,
      [createdPurchase.id, item.product_id, item.quantity_ordered, item.unit_cost, totalCost]
    );
  }

  return createdPurchase;
};

export const findById = async (id: string, outletId: string, client: any = pool): Promise<Purchase | null> => {
  const result = await client.query(
    `SELECT p.*, v.name as vendor_name, u.name as creator_name, a.name as payment_account_name
     FROM purchases p
     JOIN vendors v ON p.vendor_id = v.id
     LEFT JOIN users u ON p.created_by = u.id
     LEFT JOIN accounts a ON p.payment_account_id = a.id
     WHERE p.id = $1 AND p.outlet_id = $2`,
    [id, outletId]
  );
  return (result.rows && result.rows.length > 0) ? result.rows[0] : null;
};

export const findItemsByPurchaseId = async (purchaseId: string, client: any = pool): Promise<PurchaseItem[]> => {
  const result = await client.query(
    `SELECT pi.*, prod.name as product_name, prod.sku as product_sku
     FROM purchase_items pi
     JOIN products prod ON pi.product_id = prod.id
     WHERE pi.purchase_id = $1`,
    [purchaseId]
  );
  return result.rows;
};

export const findAll = async (
  outletId: string,
  filters: {
    status?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
    unfinishedOnly?: boolean;
  }
): Promise<Purchase[]> => {
  const conditions = ['p.outlet_id = $1'];
  const values: any[] = [outletId];
  let idx = 2;

  if (filters.status) {
    conditions.push(`p.status = $${idx++}`);
    values.push(filters.status);
  }

  if (filters.unfinishedOnly) {
    conditions.push(`p.status = 'OTW'`);
  }

  if (filters.startDate) {
    conditions.push(`p.date >= $${idx++}`);
    values.push(filters.startDate);
  }

  if (filters.endDate) {
    conditions.push(`p.date <= $${idx++}`);
    values.push(filters.endDate);
  }

  if (filters.search) {
    conditions.push(`(p.po_number ILIKE $${idx} OR v.name ILIKE $${idx})`);
    values.push(`%${filters.search}%`);
    idx++;
  }

  const query = `
    SELECT p.*, v.name as vendor_name, u.name as creator_name
    FROM purchases p
    JOIN vendors v ON p.vendor_id = v.id
    LEFT JOIN users u ON p.created_by = u.id
    WHERE ${conditions.join(' AND ')}
    ORDER BY p.date DESC, p.created_at DESC
  `;

  const result = await pool.query(query, values);
  return result.rows;
};

export const updateStatus = async (
  id: string,
  outletId: string,
  status: 'OTW' | 'COMPLETED' | 'CANCELLED',
  client: any = pool
): Promise<boolean> => {
  const result = await client.query(
    `UPDATE purchases SET status = $1, updated_at = current_timestamp WHERE id = $2 AND outlet_id = $3`,
    [status, id, outletId]
  );
  return (result.rowCount ?? 0) > 0;
};

export const updateItemReceivedQuantity = async (
  itemId: string,
  quantityReceived: number,
  client: any = pool
): Promise<void> => {
  await client.query(
    `UPDATE purchase_items SET quantity_received = $1 WHERE id = $2`,
    [quantityReceived, itemId]
  );
};

export const remove = async (id: string, outletId: string, client: any = pool): Promise<boolean> => {
  const result = await client.query(
    `DELETE FROM purchases WHERE id = $1 AND outlet_id = $2`,
    [id, outletId]
  );
  return (result.rowCount ?? 0) > 0;
};

export const updateVendorPayableBalance = async (
  vendorId: string,
  outletId: string,
  amount: number,
  client: any = pool
): Promise<void> => {
  await client.query(
    `UPDATE vendors SET payable_balance = payable_balance + $1, updated_at = current_timestamp
     WHERE id = $2 AND outlet_id = $3`,
    [amount, vendorId, outletId]
  );
};
