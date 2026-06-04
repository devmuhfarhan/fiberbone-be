import { Router } from 'express';
import * as reportController from '../controllers/reportController';
import { authenticateToken } from '../middlewares/authMiddleware';
import { authorizePermission } from '../middlewares/roleMiddleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: FinanceReports
 *   description: API untuk laporan keuangan (Laba Rugi, Buku Besar)
 */

/**
 * @swagger
 * /api/finance/reports/profit-loss:
 *   get:
 *     summary: Ambil Laporan Laba Rugi
 *     tags: [FinanceReports]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: start_date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: end_date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: export
 *         required: false
 *         schema:
 *           type: string
 *           enum: [csv]
 *     responses:
 *       200:
 *         description: Berhasil mengambil laporan
 */
router.get('/profit-loss', authenticateToken, authorizePermission('akuntansi', 'read'), reportController.getProfitAndLoss);

/**
 * @swagger
 * /api/finance/reports/general-ledger:
 *   get:
 *     summary: Ambil Laporan Buku Besar
 *     tags: [FinanceReports]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: account_id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: start_date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: end_date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: export
 *         required: false
 *         schema:
 *           type: string
 *           enum: [csv]
 *     responses:
 *       200:
 *         description: Berhasil mengambil laporan
 */
router.get('/general-ledger', authenticateToken, authorizePermission('akuntansi', 'read'), reportController.getGeneralLedger);

/**
 * @swagger
 * /api/finance/reports/sales:
 *   get:
 *     summary: Laporan Penjualan
 *     tags: [Reports]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: start_date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: end_date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: export
 *         required: false
 *         schema:
 *           type: string
 *           enum: [csv]
 *     responses:
 *       200:
 *         description: Berhasil mengambil laporan
 */
router.get('/sales', authenticateToken, authorizePermission('akuntansi', 'read'), reportController.getSalesReport);

/**
 * @swagger
 * /api/finance/reports/receivables:
 *   get:
 *     summary: Laporan Piutang Pelanggan
 *     tags: [Reports]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: export
 *         required: false
 *         schema:
 *           type: string
 *           enum: [csv]
 *     responses:
 *       200:
 *         description: Berhasil mengambil laporan
 */
router.get('/receivables', authenticateToken, authorizePermission('akuntansi', 'read'), reportController.getReceivablesReport);

/**
 * @swagger
 * /api/finance/reports/payables:
 *   get:
 *     summary: Laporan Hutang Vendor
 *     tags: [Reports]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: export
 *         required: false
 *         schema:
 *           type: string
 *           enum: [csv]
 *     responses:
 *       200:
 *         description: Berhasil mengambil laporan
 */
router.get('/payables', authenticateToken, authorizePermission('akuntansi', 'read'), reportController.getPayablesReport);

/**
 * @swagger
 * /api/finance/reports/stock-adjustments:
 *   get:
 *     summary: Laporan Penyesuaian Stok (Opname)
 *     tags: [Reports]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: start_date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: end_date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: export
 *         required: false
 *         schema:
 *           type: string
 *           enum: [csv]
 *     responses:
 *       200:
 *         description: Berhasil mengambil laporan
 */
router.get('/stock-adjustments', authenticateToken, authorizePermission('akuntansi', 'read'), reportController.getStockAdjustmentReport);

export default router;
