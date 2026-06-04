import { Router } from 'express';
import * as posController from '../controllers/posController';
import { authenticateToken } from '../middlewares/authMiddleware';
import { authorizePermission } from '../middlewares/roleMiddleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: POS
 *   description: API untuk Kasir / Penjualan
 */

/**
 * @swagger
 * /api/pos/checkout:
 *   post:
 *     summary: Melakukan transaksi penjualan (checkout)
 *     tags: [POS]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               customer_id:
 *                 type: string
 *               voucher_id:
 *                 type: string
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     product_id:
 *                       type: string
 *                     quantity:
 *                       type: number
 *                     unit_price:
 *                       type: number
 *               payment_method:
 *                 type: string
 *               payment_account_id:
 *                 type: string
 *               paid_amount:
 *                 type: number
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Berhasil memproses transaksi
 */
router.post('/checkout', authenticateToken, authorizePermission('pos', 'create'), posController.checkout);

/**
 * @swagger
 * /api/pos/sales:
 *   get:
 *     summary: Ambil riwayat penjualan
 *     tags: [POS]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mengambil data
 */
router.get('/sales', authenticateToken, authorizePermission('pos', 'read'), posController.getSales);

/**
 * @swagger
 * /api/pos/sales/{id}:
 *   get:
 *     summary: Ambil detail penjualan
 *     tags: [POS]
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
 *         description: Berhasil mengambil detail data
 */
router.get('/sales/:id', authenticateToken, authorizePermission('pos', 'read'), posController.getSaleById);

export default router;
