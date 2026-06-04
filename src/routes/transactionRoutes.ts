import { Router } from 'express';
import * as transactionController from '../controllers/transactionController';
import { authenticateToken } from '../middlewares/authMiddleware';
import { authorizePermission } from '../middlewares/roleMiddleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: FinanceTransactions
 *   description: API untuk transaksi keuangan (Pindah Saldo, Pengeluaran, Pemasukan, Hutang)
 */

/**
 * @swagger
 * /api/finance/transactions/transfer:
 *   post:
 *     summary: Catat transaksi pindah saldo antar kas/bank
 *     tags: [FinanceTransactions]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [from_account_id, to_account_id, amount, date, journal_number]
 *             properties:
 *               from_account_id:
 *                 type: string
 *               to_account_id:
 *                 type: string
 *               amount:
 *                 type: number
 *               date:
 *                 type: string
 *                 format: date
 *               description:
 *                 type: string
 *               journal_number:
 *                 type: string
 *     responses:
 *       201:
 *         description: Transaksi berhasil dicatat
 */
router.post('/transfer', authenticateToken, authorizePermission('akuntansi', 'create'), transactionController.createTransfer);

/**
 * @swagger
 * /api/finance/transactions/expense:
 *   post:
 *     summary: Catat transaksi pengeluaran biaya
 *     tags: [FinanceTransactions]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [expense_account_id, payment_account_id, amount, date, journal_number]
 *             properties:
 *               expense_account_id:
 *                 type: string
 *               payment_account_id:
 *                 type: string
 *               amount:
 *                 type: number
 *               date:
 *                 type: string
 *                 format: date
 *               description:
 *                 type: string
 *               journal_number:
 *                 type: string
 *     responses:
 *       201:
 *         description: Transaksi berhasil dicatat
 */
router.post('/expense', authenticateToken, authorizePermission('akuntansi', 'create'), transactionController.createExpense);

/**
 * @swagger
 * /api/finance/transactions/income:
 *   post:
 *     summary: Catat transaksi pemasukan/pendapatan
 *     tags: [FinanceTransactions]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [income_account_id, deposit_account_id, amount, date, journal_number]
 *             properties:
 *               income_account_id:
 *                 type: string
 *               deposit_account_id:
 *                 type: string
 *               amount:
 *                 type: number
 *               date:
 *                 type: string
 *                 format: date
 *               description:
 *                 type: string
 *               journal_number:
 *                 type: string
 *     responses:
 *       201:
 *         description: Transaksi berhasil dicatat
 */
router.post('/income', authenticateToken, authorizePermission('akuntansi', 'create'), transactionController.createIncome);

/**
 * @swagger
 * /api/finance/transactions/payable:
 *   post:
 *     summary: Catat transaksi hutang usaha ke vendor
 *     tags: [FinanceTransactions]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [payable_account_id, target_account_id, amount, date, journal_number, vendor_id]
 *             properties:
 *               payable_account_id:
 *                 type: string
 *               target_account_id:
 *                 type: string
 *               amount:
 *                 type: number
 *               date:
 *                 type: string
 *                 format: date
 *               description:
 *                 type: string
 *               journal_number:
 *                 type: string
 *               vendor_id:
 *                 type: string
 *     responses:
 *       201:
 *         description: Transaksi berhasil dicatat
 */
router.post('/payable', authenticateToken, authorizePermission('akuntansi', 'create'), transactionController.createPayable);

export default router;
