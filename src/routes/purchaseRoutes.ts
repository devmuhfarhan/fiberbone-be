import { Router } from 'express';
import * as purchaseController from '../controllers/purchaseController';
import { authenticateToken } from '../middlewares/authMiddleware';
import { authorizePermission } from '../middlewares/roleMiddleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Purchase
 *   description: API untuk manajemen pembelian & PO
 */

/**
 * @swagger
 * /api/purchases:
 *   post:
 *     summary: Membuat Purchase Order (PO) baru
 *     tags: [Purchase]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [vendor_id, date, payment_method, items]
 *             properties:
 *               vendor_id:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *               payment_method:
 *                 type: string
 *                 enum: [CASH, TRANSFER, HUTANG]
 *               payment_account_id:
 *                 type: string
 *                 description: Akun Kas/Bank jika CASH/TRANSFER (opsional)
 *               notes:
 *                 type: string
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [product_id, quantity_ordered, unit_cost]
 *                   properties:
 *                     product_id:
 *                       type: string
 *                     quantity_ordered:
 *                       type: number
 *                     unit_cost:
 *                       type: number
 *     responses:
 *       201:
 *         description: PO berhasil dibuat
 *   get:
 *     summary: Mendapatkan riwayat seluruh Purchase Order (PO)
 *     tags: [Purchase]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *       - in: query
 *         name: unfinished_only
 *         schema:
 *           type: string
 *           enum: [true, false]
 *     responses:
 *       200:
 *         description: Berhasil memuat daftar PO
 */
router.post('/', authenticateToken, authorizePermission('pembelian', 'create'), purchaseController.createPurchase);
router.get('/', authenticateToken, authorizePermission('pembelian', 'read'), purchaseController.getPurchases);

/**
 * @swagger
 * /api/purchases/{id}:
 *   get:
 *     summary: Mendapatkan detail Purchase Order berdasarkan ID
 *     tags: [Purchase]
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
 *         description: Berhasil memuat detail PO
 *       404:
 *         description: PO tidak ditemukan
 *   delete:
 *     summary: Menghapus Purchase Order (hanya jika status OTW dan belum ada penerimaan)
 *     tags: [Purchase]
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
 *         description: PO berhasil dihapus
 */
router.get('/:id', authenticateToken, authorizePermission('pembelian', 'read'), purchaseController.getPurchaseById);
router.delete('/:id', authenticateToken, authorizePermission('pembelian', 'delete'), purchaseController.deletePurchase);

/**
 * @swagger
 * /api/purchases/{id}/receive:
 *   post:
 *     summary: Mencatat penerimaan barang (Terima Barang) secara parsial atau penuh
 *     tags: [Purchase]
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
 *             required: [items]
 *             properties:
 *               notes:
 *                 type: string
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [product_id, quantity_received]
 *                   properties:
 *                     product_id:
 *                       type: string
 *                     quantity_received:
 *                       type: number
 *     responses:
 *       200:
 *         description: Penerimaan barang berhasil dicatat
 */
router.post('/:id/receive', authenticateToken, authorizePermission('pembelian', 'create'), purchaseController.receiveGoods);

export default router;
