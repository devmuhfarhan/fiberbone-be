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
    return result.rows;
  } catch (error) {
    logger.error('Error in reportService.getGeneralLedger', error);
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
