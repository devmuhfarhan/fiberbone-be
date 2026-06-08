import pool from '../config/db';
import logger from '../utils/logger';

export const getProfitAndLoss = async (outletId: string, startDate: string, endDate: string) => {
  try {
    const result = await pool.query(
      `SELECT 
         a.code, a.name, a.type,
         COALESCE(SUM(ji.debit), 0) as total_debit,
         COALESCE(SUM(ji.credit), 0) as total_credit,
         CASE 
           WHEN a.type = 'Revenue' THEN COALESCE(SUM(ji.credit), 0) - COALESCE(SUM(ji.debit), 0)
           WHEN a.type = 'Expense' THEN COALESCE(SUM(ji.debit), 0) - COALESCE(SUM(ji.credit), 0)
           ELSE 0
         END as balance
       FROM accounts a
       JOIN journal_items ji ON a.id = ji.account_id
       JOIN journals j ON ji.journal_id = j.id
       WHERE a.outlet_id = $1
         AND a.type IN ('Revenue', 'Expense')
         AND j.date >= $2 AND j.date <= $3
       GROUP BY a.code, a.name, a.type
       ORDER BY a.type DESC, a.code ASC`,
      [outletId, startDate, endDate]
    );

    let totalRevenue = 0;
    let totalExpense = 0;
    
    const details = result.rows.map(r => {
      const balance = Number(r.balance) || 0;
      if (r.type === 'Revenue') totalRevenue += balance;
      if (r.type === 'Expense') totalExpense += balance;
      return { ...r, balance };
    });

    return {
      details,
      total_revenue: totalRevenue,
      total_expense: totalExpense,
      net_profit: totalRevenue - totalExpense
    };
  } catch (error) {
    logger.error('Error in reportService.getProfitAndLoss', error);
    throw error;
  }
};

export const getGeneralLedger = async (outletId: string, accountId: string, startDate: string, endDate: string) => {
  try {
    const accountResult = await pool.query(
      'SELECT id, code, name, type, balance_type FROM accounts WHERE id = $1 AND outlet_id = $2',
      [accountId, outletId]
    );
    if (accountResult.rows.length === 0) throw new Error('Account not found');
    const account = accountResult.rows[0];

    // Calculate Opening Balance
    // Sum of all entries BEFORE startDate
    const openingResult = await pool.query(
      `SELECT 
         COALESCE(SUM(ji.debit), 0) as total_debit,
         COALESCE(SUM(ji.credit), 0) as total_credit
       FROM journals j
       JOIN journal_items ji ON j.id = ji.journal_id
       WHERE j.outlet_id = $1 AND ji.account_id = $2 AND j.date < $3`,
      [outletId, accountId, startDate]
    );
    const openingData = openingResult.rows[0];
    let openingBalance = 0;
    if (account.balance_type === 'Debit') {
      openingBalance = Number(openingData.total_debit) - Number(openingData.total_credit);
    } else {
      openingBalance = Number(openingData.total_credit) - Number(openingData.total_debit);
    }

    const result = await pool.query(
      `SELECT 
         j.date, j.journal_number, j.description as journal_description, j.reference,
         ji.debit, ji.credit, ji.description as item_description
       FROM journals j
       JOIN journal_items ji ON j.id = ji.journal_id
       WHERE j.outlet_id = $1
         AND ji.account_id = $2
         AND j.date >= $3 AND j.date <= $4
       ORDER BY j.date ASC, j.created_at ASC`,
      [outletId, accountId, startDate, endDate]
    );
    
    let currentBalance = openingBalance;
    const transactions = result.rows.map(row => {
      const debit = Number(row.debit);
      const credit = Number(row.credit);
      if (account.balance_type === 'Debit') {
        currentBalance += (debit - credit);
      } else {
        currentBalance += (credit - debit);
      }
      // Note: we map j.description as description to match frontend expectations
      return { ...row, description: row.journal_description || row.item_description, balance: currentBalance };
    });

    return {
      account,
      openingBalance,
      transactions,
      closingBalance: currentBalance
    };
  } catch (error) {
    logger.error('Error in reportService.getGeneralLedger', error);
    throw error;
  }
};
export const getReceivablesReport = async (outletId: string) => {
  try {
    const result = await pool.query(
      `SELECT name, email, phone, receivable_balance 
       FROM customers 
       WHERE outlet_id = $1 AND receivable_balance > 0
       ORDER BY receivable_balance DESC`,
      [outletId]
    );
    return result.rows;
  } catch (error) {
    logger.error('Error in reportService.getReceivablesReport', error);
    throw error;
  }
};

export const getPayablesReport = async (outletId: string) => {
  try {
    const result = await pool.query(
      `SELECT 
         v.id as vendor_id, v.name as vendor_name, v.phone,
         COALESCE(SUM(ji.credit), 0) - COALESCE(SUM(ji.debit), 0) as payable_balance
       FROM vendors v
       JOIN journals j ON j.reference = 'VENDOR_ID:' || v.id
       JOIN journal_items ji ON j.id = ji.journal_id
       JOIN accounts a ON ji.account_id = a.id
       WHERE v.outlet_id = $1 AND a.code = '2000'
       GROUP BY v.id, v.name, v.phone
       HAVING COALESCE(SUM(ji.credit), 0) - COALESCE(SUM(ji.debit), 0) > 0
       ORDER BY payable_balance DESC`,
      [outletId]
    );
    return result.rows;
  } catch (error) {
    logger.error('Error in reportService.getPayablesReport', error);
    throw error;
  }
};

export const getStockAdjustmentReport = async (outletId: string, startDate: string, endDate: string) => {
  try {
    const result = await pool.query(
      `SELECT 
         t.date, t.type, t.quantity, t.notes, t.reference,
         p.sku, p.name as product_name
       FROM inventory_transactions t
       JOIN products p ON t.product_id = p.id
       WHERE t.outlet_id = $1
         AND t.type IN ('OPNAME_SURPLUS', 'OPNAME_DEFICIT', 'ADJUSTMENT')
         AND t.date::date >= $2 AND t.date::date <= $3
       ORDER BY t.date DESC`,
      [outletId, startDate, endDate]
    );
    return result.rows;
  } catch (error) {
    logger.error('Error in reportService.getStockAdjustmentReport', error);
    throw error;
  }
};

export const getSalesReport = async (outletId: string, startDate: string, endDate: string) => {
  try {
    const result = await pool.query(
      `SELECT 
         s.invoice_number, s.date, c.name as customer_name,
         s.subtotal, s.discount_amount, s.grand_total,
         s.payment_method, s.status,
         (SELECT SUM(total_cost) FROM sale_items si WHERE si.sale_id = s.id) as total_hpp,
         (s.grand_total - (SELECT SUM(total_cost) FROM sale_items si WHERE si.sale_id = s.id)) as gross_profit
       FROM sales s
       LEFT JOIN customers c ON s.customer_id = c.id
       WHERE s.outlet_id = $1
         AND s.date::date >= $2 AND s.date::date <= $3
       ORDER BY s.date DESC`,
      [outletId, startDate, endDate]
    );
    return result.rows;
  } catch (error) {
    logger.error('Error in reportService.getSalesReport', error);
    throw error;
  }
};

export const generateCSV = (data: any[]): string => {
  if (!data || data.length === 0) return '';
  const headers = Object.keys(data[0]);
  const rows = data.map(row => {
    return headers.map(header => {
      let val = row[header] !== null && row[header] !== undefined ? row[header] : '';
      if (typeof val === 'string') {
        val = val.replace(/"/g, '""');
        if (val.search(/("|,|\n)/g) >= 0) {
          val = `"${val}"`;
        }
      }
      return val;
    }).join(',');
  });
  return [headers.join(','), ...rows].join('\n');
};
