import pool from '../config/db';
import logger from '../utils/logger';

// Ambil ringkasan penjualan: hari ini, bulan ini, bulan lalu
const getSalesSummary = async (outletId: string) => {
  const result = await pool.query(
    `SELECT
       COALESCE(SUM(CASE WHEN DATE(date) = CURDATE() THEN grand_total ELSE 0 END), 0) AS today,
       COALESCE(SUM(CASE WHEN MONTH(date) = MONTH(CURDATE()) AND YEAR(date) = YEAR(CURDATE()) THEN grand_total ELSE 0 END), 0) AS this_month,
       COALESCE(SUM(CASE WHEN MONTH(date) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
                          AND YEAR(date) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)) THEN grand_total ELSE 0 END), 0) AS last_month
     FROM sales
     WHERE outlet_id = $1 AND status != 'CANCELLED'`,
    [outletId]
  );
  const r = result.rows[0];
  const thisMonth = Number(r.this_month);
  const lastMonth = Number(r.last_month);
  const pctChange = lastMonth === 0 ? (thisMonth > 0 ? 100 : 0) : Math.round(((thisMonth - lastMonth) / lastMonth) * 100);
  return { today: Number(r.today), this_month: thisMonth, last_month: lastMonth, pct_change: pctChange };
};

// Ambil ringkasan pembelian: hari ini, bulan ini, bulan lalu
const getPurchasesSummary = async (outletId: string) => {
  const result = await pool.query(
    `SELECT
       COALESCE(SUM(CASE WHEN DATE(date) = CURDATE() THEN total_amount ELSE 0 END), 0) AS today,
       COALESCE(SUM(CASE WHEN MONTH(date) = MONTH(CURDATE()) AND YEAR(date) = YEAR(CURDATE()) THEN total_amount ELSE 0 END), 0) AS this_month,
       COALESCE(SUM(CASE WHEN MONTH(date) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
                          AND YEAR(date) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)) THEN total_amount ELSE 0 END), 0) AS last_month
     FROM purchases
     WHERE outlet_id = $1`,
    [outletId]
  );
  const r = result.rows[0];
  const thisMonth = Number(r.this_month);
  const lastMonth = Number(r.last_month);
  const pctChange = lastMonth === 0 ? (thisMonth > 0 ? 100 : 0) : Math.round(((thisMonth - lastMonth) / lastMonth) * 100);
  return { today: Number(r.today), this_month: thisMonth, last_month: lastMonth, pct_change: pctChange };
};

// Ringkasan piutang
const getReceivablesSummary = async (outletId: string) => {
  const [todayResult, monthResult, balanceResult, overdueResult] = await Promise.all([
    // Piutang hari ini (sales PIUTANG hari ini)
    pool.query(
      `SELECT COALESCE(SUM(grand_total - COALESCE(paid_amount, 0)), 0) AS today
       FROM sales WHERE outlet_id = $1 AND status = 'PIUTANG' AND DATE(date) = CURDATE()`,
      [outletId]
    ),
    // Piutang bulan ini
    pool.query(
      `SELECT COALESCE(SUM(grand_total - COALESCE(paid_amount, 0)), 0) AS this_month
       FROM sales WHERE outlet_id = $1 AND status = 'PIUTANG'
         AND MONTH(date) = MONTH(CURDATE()) AND YEAR(date) = YEAR(CURDATE())`,
      [outletId]
    ),
    // Total saldo piutang dari customers
    pool.query(
      `SELECT COALESCE(SUM(receivable_balance), 0) AS total_balance
       FROM customers WHERE outlet_id = $1`,
      [outletId]
    ),
    // Piutang jatuh tempo (due_date <= CURDATE())
    pool.query(
      `SELECT COALESCE(SUM(grand_total - COALESCE(paid_amount, 0)), 0) AS overdue
       FROM sales WHERE outlet_id = $1 AND status = 'PIUTANG' AND due_date IS NOT NULL AND due_date <= CURDATE()`,
      [outletId]
    ),
  ]);
  return {
    today: Number(todayResult.rows[0].today),
    this_month: Number(monthResult.rows[0].this_month),
    total_balance: Number(balanceResult.rows[0].total_balance),
    overdue: Number(overdueResult.rows[0].overdue),
  };
};

// Ringkasan hutang
const getPayablesSummary = async (outletId: string) => {
  const [todayResult, monthResult, balanceResult, overdueResult] = await Promise.all([
    // Hutang hari ini (purchases dengan status HUTANG hari ini)
    pool.query(
      `SELECT COALESCE(SUM(total_amount), 0) AS today
       FROM purchases WHERE outlet_id = $1 AND payment_method = 'HUTANG' AND DATE(date) = CURDATE()`,
      [outletId]
    ),
    // Hutang bulan ini
    pool.query(
      `SELECT COALESCE(SUM(total_amount), 0) AS this_month
       FROM purchases WHERE outlet_id = $1 AND payment_method = 'HUTANG'
         AND MONTH(date) = MONTH(CURDATE()) AND YEAR(date) = YEAR(CURDATE())`,
      [outletId]
    ),
    // Total saldo hutang dari vendors
    pool.query(
      `SELECT COALESCE(SUM(payable_balance), 0) AS total_balance
       FROM vendors WHERE outlet_id = $1`,
      [outletId]
    ),
    // Hutang jatuh tempo
    pool.query(
      `SELECT COALESCE(SUM(total_amount), 0) AS overdue
       FROM purchases WHERE outlet_id = $1 AND payment_method = 'HUTANG'
         AND due_date IS NOT NULL AND due_date <= CURDATE()`,
      [outletId]
    ),
  ]);
  return {
    today: Number(todayResult.rows[0].today),
    this_month: Number(monthResult.rows[0].this_month),
    total_balance: Number(balanceResult.rows[0].total_balance),
    overdue: Number(overdueResult.rows[0].overdue),
  };
};

// Data grafik penjualan 30 hari
const getSalesChart = async (outletId: string) => {
  const result = await pool.query(
    `SELECT DATE(date) AS date, COALESCE(SUM(grand_total), 0) AS total
     FROM sales
     WHERE outlet_id = $1
       AND date >= DATE_SUB(CURDATE(), INTERVAL 29 DAY)
       AND status != 'CANCELLED'
     GROUP BY DATE(date)
     ORDER BY DATE(date) ASC`,
    [outletId]
  );
  return result.rows.map(r => ({ date: r.date, total: Number(r.total) }));
};

// 10 produk stok terendah (di bawah/sama dengan min_stock)
const getLowStockProducts = async (outletId: string) => {
  const result = await pool.query(
    `SELECT id, name, stock, min_stock, image_url
     FROM products
     WHERE outlet_id = $1 AND is_active = TRUE AND stock <= min_stock
     ORDER BY stock ASC
     LIMIT 10`,
    [outletId]
  );
  return result.rows.map(r => ({
    ...r,
    stock: Number(r.stock),
    min_stock: Number(r.min_stock),
    is_low: Number(r.stock) <= Number(r.min_stock),
  }));
};

// Top 10 pelanggan berdasarkan total belanja
const getTopCustomers = async (outletId: string) => {
  const result = await pool.query(
    `SELECT c.id AS customer_id, c.name, c.phone,
            COUNT(s.id) AS transaction_count,
            COALESCE(SUM(s.grand_total), 0) AS total_spend
     FROM customers c
     JOIN sales s ON s.customer_id = c.id
     WHERE c.outlet_id = $1 AND s.status != 'CANCELLED'
     GROUP BY c.id, c.name, c.phone
     ORDER BY total_spend DESC
     LIMIT 10`,
    [outletId]
  );
  return result.rows.map(r => ({ ...r, transaction_count: Number(r.transaction_count), total_spend: Number(r.total_spend) }));
};

// Piutang jatuh tempo (detail per pelanggan)
const getOverdueReceivables = async (outletId: string) => {
  const result = await pool.query(
    `SELECT c.id AS customer_id, c.name, c.phone,
            s.id AS sale_id, s.invoice_number,
            (s.grand_total - COALESCE(s.paid_amount, 0)) AS outstanding,
            s.due_date,
            DATEDIFF(CURDATE(), s.due_date) AS days_overdue
     FROM sales s
     JOIN customers c ON s.customer_id = c.id
     WHERE s.outlet_id = $1
       AND s.status = 'PIUTANG'
       AND s.due_date IS NOT NULL
       AND s.due_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)
     ORDER BY s.due_date ASC
     LIMIT 20`,
    [outletId]
  );
  return result.rows.map(r => ({ ...r, outstanding: Number(r.outstanding), days_overdue: Number(r.days_overdue) }));
};

// Entry point utama: kumpulkan semua data dashboard secara paralel
export const getDashboardStats = async (outletId: string) => {
  try {
    const [sales, purchases, receivables, payables, salesChart, lowStock, topCustomers, overdueReceivables] =
      await Promise.all([
        getSalesSummary(outletId),
        getPurchasesSummary(outletId),
        getReceivablesSummary(outletId),
        getPayablesSummary(outletId),
        getSalesChart(outletId),
        getLowStockProducts(outletId),
        getTopCustomers(outletId),
        getOverdueReceivables(outletId),
      ]);

    return { sales, purchases, receivables, payables, sales_chart: salesChart, low_stock: lowStock, top_customers: topCustomers, overdue_receivables: overdueReceivables };
  } catch (error) {
    logger.error('Error in dashboardService.getDashboardStats', error);
    throw error;
  }
};
