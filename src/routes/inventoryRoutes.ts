import { Router } from 'express';
import * as inventoryController from '../controllers/inventoryController';
import * as inventoryHistoryController from '../controllers/inventoryHistoryController';
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
 * /api/inventory/history/opname:
 *   get:
 *     summary: Ambil riwayat penyesuaian stok opname secara global
 *     tags: [Inventory]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Nomor halaman data
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Batas jumlah data per halaman
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *         description: Tanggal mulai penapisan (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *         description: Tanggal akhir penapisan (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Berhasil mengambil data riwayat opname
 */
router.get('/history/opname', authenticateToken, authorizePermission('stok', 'read'), inventoryHistoryController.getOpnameHistory);

/**
 * @swagger
 * /api/inventory/history/mutations:
 *   get:
 *     summary: Ambil riwayat alur mutasi stok secara global
 *     tags: [Inventory]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Nomor halaman data
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Batas jumlah data per halaman
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *         description: Tanggal mulai penapisan (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *         description: Tanggal akhir penapisan (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Berhasil mengambil data riwayat mutasi stok
 */
router.get('/history/mutations', authenticateToken, authorizePermission('stok', 'read'), inventoryHistoryController.getMutationHistory);

/**
 * @swagger
 * /api/inventory/history/batches:
 *   get:
 *     summary: Ambil daftar batch FIFO aktif secara global
 *     tags: [Inventory]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Nomor halaman data
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Batas jumlah data per halaman
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *         description: Tanggal mulai penapisan (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *         description: Tanggal akhir penapisan (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Berhasil mengambil data batch FIFO aktif
 */
router.get('/history/batches', authenticateToken, authorizePermission('stok', 'read'), inventoryHistoryController.getBatchHistory);

/**
 * @swagger
 * /api/inventory/history/exchanges:
 *   get:
 *     summary: Ambil riwayat penukaran barang secara global
 *     tags: [Inventory]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Nomor halaman data
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Batas jumlah data per halaman
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *         description: Tanggal mulai penapisan (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *         description: Tanggal akhir penapisan (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Berhasil mengambil data riwayat penukaran barang
 */
router.get('/history/exchanges', authenticateToken, authorizePermission('stok', 'read'), inventoryHistoryController.getExchangeHistory);

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

/**
 * @swagger
 * /api/inventory/exchange:
 *   post:
 *     summary: Melakukan penukaran barang yang sudah dibeli customer
 *     tags: [Inventory]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [returned_product_id, returned_quantity, exchange_product_id, exchange_quantity]
 *             properties:
 *               returned_product_id:
 *                 type: string
 *               returned_quantity:
 *                 type: number
 *               exchange_product_id:
 *                 type: string
 *               exchange_quantity:
 *                 type: number
 *               payment_account_id:
 *                 type: string
 *                 description: ID akun pembayaran untuk menerima selisih uang (opsional, default Kas)
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Penukaran barang berhasil dan jurnal akuntansi telah dicatat
 */
router.post('/exchange', authenticateToken, authorizePermission('stok', 'create'), inventoryController.exchangeItems);

export default router;
