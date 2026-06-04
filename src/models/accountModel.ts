import pool from '../config/db';

export type AccountType = 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';
export type BalanceType = 'Debit' | 'Credit';

export interface Account {
  id: string;
  outlet_id: string;
  code: string;
  name: string;
  type: AccountType;
  balance_type: BalanceType;
  created_at: Date;
  updated_at: Date;
}

export interface CreateAccountData {
  outlet_id: string;
  code: string;
  name: string;
  type: AccountType;
  balance_type: BalanceType;
}

export interface UpdateAccountData {
  code?: string;
  name?: string;
  type?: AccountType;
  balance_type?: BalanceType;
}

export const findAllByOutletId = async (outletId: string): Promise<Account[]> => {
  const result = await pool.query(
    'SELECT * FROM accounts WHERE outlet_id = $1 ORDER BY code ASC',
    [outletId]
  );
  return result.rows;
};

export const findByIdAndOutletId = async (id: string, outletId: string): Promise<Account | null> => {
  const result = await pool.query(
    'SELECT * FROM accounts WHERE id = $1 AND outlet_id = $2',
    [id, outletId]
  );
  return result.rows[0] || null;
};

export const findByCodeAndOutletId = async (code: string, outletId: string): Promise<Account | null> => {
  const result = await pool.query(
    'SELECT * FROM accounts WHERE code = $1 AND outlet_id = $2',
    [code, outletId]
  );
  return result.rows[0] || null;
};

export const createAccount = async (data: CreateAccountData): Promise<Account> => {
  const result = await pool.query(
    `INSERT INTO accounts (outlet_id, code, name, type, balance_type)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [data.outlet_id, data.code, data.name, data.type, data.balance_type]
  );
  return result.rows[0];
};

export const updateAccount = async (id: string, outletId: string, data: UpdateAccountData): Promise<Account | null> => {
  const fields: string[] = [];
  const values: any[] = [];
  let idx = 1;

  if (data.code !== undefined) { fields.push(`code = $${idx++}`); values.push(data.code); }
  if (data.name !== undefined) { fields.push(`name = $${idx++}`); values.push(data.name); }
  if (data.type !== undefined) { fields.push(`type = $${idx++}`); values.push(data.type); }
  if (data.balance_type !== undefined) { fields.push(`balance_type = $${idx++}`); values.push(data.balance_type); }

  if (fields.length === 0) return findByIdAndOutletId(id, outletId);

  fields.push(`updated_at = current_timestamp`);
  values.push(id, outletId);

  const result = await pool.query(
    `UPDATE accounts SET ${fields.join(', ')} 
     WHERE id = $${idx} AND outlet_id = $${idx + 1}
     RETURNING *`,
    values
  );
  return result.rows[0] || null;
};

export const deleteAccount = async (id: string, outletId: string): Promise<boolean> => {
  const result = await pool.query(
    'DELETE FROM accounts WHERE id = $1 AND outlet_id = $2',
    [id, outletId]
  );
  return (result.rowCount ?? 0) > 0;
};

export const seedDefaultAccounts = async (outletId: string): Promise<void> => {
  await pool.query(
    `INSERT INTO accounts (outlet_id, code, name, type, balance_type)
     VALUES 
        ($1, '1000', 'Kas & Bank', 'Asset', 'Debit'),
        ($1, '1100', 'Piutang Usaha', 'Asset', 'Debit'),
        ($1, '1200', 'Persediaan', 'Asset', 'Debit'),
        ($1, '2000', 'Hutang Usaha', 'Liability', 'Credit'),
        ($1, '3000', 'Modal', 'Equity', 'Credit'),
        ($1, '4000', 'Pendapatan Penjualan', 'Revenue', 'Credit'),
        ($1, '4100', 'Pendapatan Penyesuaian Persediaan', 'Revenue', 'Credit'),
        ($1, '5000', 'Harga Pokok Penjualan', 'Expense', 'Debit'),
        ($1, '6000', 'Biaya Operasional', 'Expense', 'Debit'),
        ($1, '6100', 'Beban Kerugian Persediaan', 'Expense', 'Debit')
     ON CONFLICT (outlet_id, code) DO NOTHING;`,
    [outletId]
  );
};

export const getBalanceSheet = async (outletId: string): Promise<any[]> => {
  const result = await pool.query(
    `SELECT 
       a.id, a.code, a.name, a.type, a.balance_type,
       COALESCE(SUM(ji.debit), 0) as total_debit,
       COALESCE(SUM(ji.credit), 0) as total_credit,
       CASE 
         WHEN a.balance_type = 'Debit' THEN COALESCE(SUM(ji.debit), 0) - COALESCE(SUM(ji.credit), 0)
         ELSE COALESCE(SUM(ji.credit), 0) - COALESCE(SUM(ji.debit), 0)
       END as balance
     FROM accounts a
     LEFT JOIN journal_items ji ON a.id = ji.account_id
     WHERE a.outlet_id = $1
     GROUP BY a.id, a.code, a.name, a.type, a.balance_type
     ORDER BY a.code ASC`,
    [outletId]
  );
  return result.rows;
};
