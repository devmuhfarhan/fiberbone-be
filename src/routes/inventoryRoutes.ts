import { Router } from 'express';
import * as inventoryController from '../controllers/inventoryController';
import { authenticateToken } from '../middlewares/authMiddleware';
import { authorizePermission } from '../middlewares/roleMiddleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Inventory
 *   description: API untuk manajemen stok dan opname
 */

/**
 * @swagger
 * /api/inventory/products/{product_id}/batches:
 *   get:
 *     summary: Ambil daftar batch inventaris (FIFO) suatu produk
 *     tags: [Inventory]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: product_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Berhasil mengambil data batch
 */
router.get('/products/:product_id/batches', authenticateToken, authorizePermission('stok', 'read'), inventoryController.getBatches);

/**
 * @swagger
 * /api/inventory/products/{product_id}/transactions:
 *   get:
 *     summary: Ambil riwayat mutasi stok suatu produk
 *     tags: [Inventory]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: product_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Berhasil mengambil riwayat transaksi
 */
router.get('/products/:product_id/transactions', authenticateToken, authorizePermission('stok', 'read'), inventoryController.getTransactions);

/**
 * @swagger
 * /api/inventory/opname:
 *   post:
 *     summary: Melakukan stock opname (penyesuaian stok fisik)
 *     tags: [Inventory]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [product_id, physical_quantity]
 *             properties:
 *               product_id:
 *                 type: string
 *               physical_quantity:
 *                 type: number
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Opname berhasil diselesaikan dan jurnal telah dicatat jika ada selisih
 */
router.post('/opname', authenticateToken, authorizePermission('stok', 'create'), inventoryController.stockOpname);

export default router;
