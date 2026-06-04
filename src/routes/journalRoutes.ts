import { Router } from 'express';
import * as journalController from '../controllers/journalController';
import * as accountController from '../controllers/accountController';
import { authenticateToken } from '../middlewares/authMiddleware';
import { authorizePermission } from '../middlewares/roleMiddleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Finance
 */

/**
 * @swagger
 * /api/finance/balance-sheet:
 *   get:
 *     summary: Ambil Laporan Neraca (Balance Sheet)
 *     tags: [Finance]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mengambil neraca
 */
router.get('/balance-sheet', authenticateToken, authorizePermission('akuntansi', 'read'), accountController.getBalanceSheet);

/**
 * @swagger
 * /api/finance/journals:
 *   get:
 *     summary: Ambil daftar jurnal
 *     tags: [Finance]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mengambil data jurnal
 */
router.get('/journals', authenticateToken, authorizePermission('akuntansi', 'read'), journalController.getJournals);

/**
 * @swagger
 * /api/finance/journals/{id}:
 *   get:
 *     summary: Ambil detail jurnal
 *     tags: [Finance]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Berhasil mengambil detail jurnal
 */
router.get('/journals/:id', authenticateToken, authorizePermission('akuntansi', 'read'), journalController.getJournalById);

/**
 * @swagger
 * /api/finance/journals:
 *   post:
 *     summary: Buat jurnal akuntansi (double-entry)
 *     tags: [Finance]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - journal_number
 *               - date
 *               - description
 *               - items
 *             properties:
 *               journal_number:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *               description:
 *                 type: string
 *               reference:
 *                 type: string
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - account_id
 *                     - debit
 *                     - credit
 *                   properties:
 *                     account_id:
 *                       type: string
 *                     debit:
 *                       type: number
 *                     credit:
 *                       type: number
 *                     description:
 *                       type: string
 *     responses:
 *       201:
 *         description: Jurnal berhasil dibuat
 */
router.post('/journals', authenticateToken, authorizePermission('akuntansi', 'create'), journalController.createJournal);

export default router;
