import { Router } from 'express';
import * as accountController from '../controllers/accountController';
import { authenticateToken } from '../middlewares/authMiddleware';
import { authorizePermission } from '../middlewares/roleMiddleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Finance
 *   description: API untuk fitur Keuangan & Akuntansi (Neraca & Jurnal)
 */

/**
 * @swagger
 * /api/accounts:
 *   get:
 *     summary: Ambil daftar akun
 *     tags: [Finance]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mengambil data akun
 */
router.get('/', authenticateToken, authorizePermission('akuntansi', 'read'), accountController.getAccounts);

/**
 * @swagger
 * /api/accounts:
 *   post:
 *     summary: Buat akun baru
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
 *               - code
 *               - name
 *               - type
 *               - balance_type
 *             properties:
 *               code:
 *                 type: string
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [Asset, Liability, Equity, Revenue, Expense]
 *               balance_type:
 *                 type: string
 *                 enum: [Debit, Credit]
 *     responses:
 *       201:
 *         description: Akun berhasil dibuat
 */
router.post('/', authenticateToken, authorizePermission('akuntansi', 'create'), accountController.createAccount);

/**
 * @swagger
 * /api/accounts/{id}:
 *   put:
 *     summary: Update data akun
 *     tags: [Finance]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [Asset, Liability, Equity, Revenue, Expense]
 *               balance_type:
 *                 type: string
 *                 enum: [Debit, Credit]
 *     responses:
 *       200:
 *         description: Akun berhasil diupdate
 */
router.put('/:id', authenticateToken, authorizePermission('akuntansi', 'edit'), accountController.updateAccount);

/**
 * @swagger
 * /api/accounts/{id}:
 *   delete:
 *     summary: Hapus data akun
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
 *         description: Akun berhasil dihapus
 */
router.delete('/:id', authenticateToken, authorizePermission('akuntansi', 'delete'), accountController.deleteAccount);

export default router;
