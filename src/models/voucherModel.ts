import pool from '../config/db';

export type DiscountType = 'PERCENTAGE' | 'FIXED';

export interface Voucher {
  id: string;
  outlet_id: string;
  customer_id?: string;
  code: string;
  discount_type: DiscountType;
  discount_value: number;
  is_used: boolean;
  valid_until?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface CreateVoucherData {
  outlet_id: string;
  customer_id?: string;
  code: string;
  discount_type: DiscountType;
  discount_value: number;
  valid_until?: Date | string;
}

export interface UpdateVoucherData {
  customer_id?: string | null;
  discount_type?: DiscountType;
  discount_value?: number;
  is_used?: boolean;
  valid_until?: Date | string | null;
}

export const findAllByOutletId = async (outletId: string): Promise<Voucher[]> => {
  const result = await pool.query(
    'SELECT * FROM vouchers WHERE outlet_id = $1 ORDER BY created_at DESC',
    [outletId]
  );
  return result.rows;
};

export const findByIdAndOutletId = async (id: string, outletId: string): Promise<Voucher | null> => {
  const result = await pool.query(
    'SELECT * FROM vouchers WHERE id = $1 AND outlet_id = $2',
    [id, outletId]
  );
  return result.rows[0] || null;
};

export const findByCodeAndOutletId = async (code: string, outletId: string): Promise<Voucher | null> => {
  const result = await pool.query(
    'SELECT * FROM vouchers WHERE code = $1 AND outlet_id = $2',
    [code, outletId]
  );
  return result.rows[0] || null;
};

export const createVoucher = async (data: CreateVoucherData): Promise<Voucher> => {
  const result = await pool.query(
    `INSERT INTO vouchers (outlet_id, customer_id, code, discount_type, discount_value, valid_until)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [data.outlet_id, data.customer_id, data.code, data.discount_type, data.discount_value, data.valid_until]
  );
  return result.rows[0];
};

export const updateVoucher = async (id: string, outletId: string, data: UpdateVoucherData): Promise<Voucher | null> => {
  const fields: string[] = [];
  const values: any[] = [];
  let idx = 1;

  if (data.customer_id !== undefined) { fields.push(`customer_id = $${idx++}`); values.push(data.customer_id); }
  if (data.discount_type !== undefined) { fields.push(`discount_type = $${idx++}`); values.push(data.discount_type); }
  if (data.discount_value !== undefined) { fields.push(`discount_value = $${idx++}`); values.push(data.discount_value); }
  if (data.is_used !== undefined) { fields.push(`is_used = $${idx++}`); values.push(data.is_used); }
  if (data.valid_until !== undefined) { fields.push(`valid_until = $${idx++}`); values.push(data.valid_until); }

  if (fields.length === 0) return findByIdAndOutletId(id, outletId);

  fields.push(`updated_at = current_timestamp`);
  values.push(id, outletId);

  const result = await pool.query(
    `UPDATE vouchers SET ${fields.join(', ')} 
     WHERE id = $${idx} AND outlet_id = $${idx + 1} RETURNING *`,
    values
  );
  return result.rows[0] || null;
};

export const deleteVoucher = async (id: string, outletId: string): Promise<boolean> => {
  const result = await pool.query(
    'DELETE FROM vouchers WHERE id = $1 AND outlet_id = $2',
    [id, outletId]
  );
  return (result.rowCount ?? 0) > 0;
};
