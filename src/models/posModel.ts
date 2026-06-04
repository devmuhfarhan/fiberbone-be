import pool from '../config/db';

export type SaleStatus = 'COMPLETED' | 'PIUTANG' | 'CANCELLED';

export interface Sale {
  id: string;
  outlet_id: string;
  customer_id?: string;
  voucher_id?: string;
  invoice_number: string;
  date: Date;
  subtotal: number;
  discount_amount: number;
  grand_total: number;
  payment_method: string;
  payment_account_id?: string;
  paid_amount: number;
  change_amount: number;
  status: SaleStatus;
  notes?: string;
  created_at: Date;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  total_cost: number;
}

export const generateInvoiceNumber = async (outletId: string): Promise<string> => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `INV-${dateStr}-`;
  
  const result = await pool.query(
    `SELECT invoice_number FROM sales WHERE outlet_id = $1 AND invoice_number LIKE $2 ORDER BY invoice_number DESC LIMIT 1`,
    [outletId, `${prefix}%`]
  );

  let sequence = 1;
  if (result.rows.length > 0) {
    const lastInvoice = result.rows[0].invoice_number;
    const lastSequence = parseInt(lastInvoice.split('-')[2], 10);
    if (!isNaN(lastSequence)) {
      sequence = lastSequence + 1;
    }
  }

  return `${prefix}${sequence.toString().padStart(3, '0')}`;
};

export const createSale = async (data: Partial<Sale>, client: any = pool): Promise<Sale> => {
  const result = await client.query(
    `INSERT INTO sales (
      outlet_id, customer_id, voucher_id, invoice_number, subtotal, 
      discount_amount, grand_total, payment_method, payment_account_id, 
      paid_amount, change_amount, status, notes
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
    [
      data.outlet_id, data.customer_id, data.voucher_id, data.invoice_number, data.subtotal,
      data.discount_amount, data.grand_total, data.payment_method, data.payment_account_id,
      data.paid_amount, data.change_amount, data.status, data.notes
    ]
  );
  return result.rows[0];
};

export const createSaleItem = async (data: Partial<SaleItem>, client: any = pool): Promise<SaleItem> => {
  const result = await client.query(
    `INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, total_price, total_cost)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [data.sale_id, data.product_id, data.quantity, data.unit_price, data.total_price, data.total_cost]
  );
  return result.rows[0];
};

export const getSalesByOutletId = async (outletId: string, limit = 50, offset = 0): Promise<Sale[]> => {
  const result = await pool.query(
    'SELECT * FROM sales WHERE outlet_id = $1 ORDER BY date DESC LIMIT $2 OFFSET $3',
    [outletId, limit, offset]
  );
  return result.rows;
};

export const getSaleByIdAndOutletId = async (id: string, outletId: string): Promise<Sale | null> => {
  const result = await pool.query(
    'SELECT * FROM sales WHERE id = $1 AND outlet_id = $2',
    [id, outletId]
  );
  return result.rows[0] || null;
};

export const getSaleItemsBySaleId = async (saleId: string): Promise<SaleItem[]> => {
  const result = await pool.query(
    'SELECT * FROM sale_items WHERE sale_id = $1',
    [saleId]
  );
  return result.rows;
};
