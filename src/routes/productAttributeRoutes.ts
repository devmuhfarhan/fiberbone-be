import { Router } from 'express';
import * as ctrl from '../controllers/productAttributeController';
import { authenticateToken } from '../middlewares/authMiddleware';
import { authorizePermission } from '../middlewares/roleMiddleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: ProductAttributes
 *   description: API untuk manajemen atribut produk (kategori & satuan) per outlet
 */

// ─── KATEGORI ────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/product-attributes/categories:
 *   get:
 *     summary: Ambil daftar kategori produk
 *     tags: [ProductAttributes]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Daftar kategori
 *       400:
 *         description: Tidak ada outlet aktif
 */
router.get('/categories', authenticateToken, authorizePermission('atribut-produk', 'read'), ctrl.getCategories);

/**
 * @swagger
 * /api/product-attributes/categories:
 *   post:
 *     summary: Buat kategori produk baru
 *     tags: [ProductAttributes]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Kategori berhasil dibuat
 *       400:
 *         description: Input tidak valid
 */
router.post('/categories', authenticateToken, authorizePermission('atribut-produk', 'create'), ctrl.createCategory);

/**
 * @swagger
 * /api/product-attributes/categories/{id}:
 *   put:
 *     summary: Update kategori produk
 *     tags: [ProductAttributes]
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
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Kategori berhasil diupdate
 *       404:
 *         description: Kategori tidak ditemukan
 */
router.put('/categories/:id', authenticateToken, authorizePermission('atribut-produk', 'edit'), ctrl.updateCategory);

/**
 * @swagger
 * /api/product-attributes/categories/{id}:
 *   delete:
 *     summary: Hapus kategori produk
 *     tags: [ProductAttributes]
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
 *         description: Kategori berhasil dihapus
 *       404:
 *         description: Kategori tidak ditemukan
 */
router.delete('/categories/:id', authenticateToken, authorizePermission('atribut-produk', 'delete'), ctrl.deleteCategory);

// ─── SATUAN ──────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/product-attributes/units:
 *   get:
 *     summary: Ambil daftar satuan produk
 *     tags: [ProductAttributes]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Daftar satuan
 */
router.get('/units', authenticateToken, authorizePermission('atribut-produk', 'read'), ctrl.getUnits);

/**
 * @swagger
 * /api/product-attributes/units:
 *   post:
 *     summary: Buat satuan produk baru
 *     tags: [ProductAttributes]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Kilogram
 *               abbreviation:
 *                 type: string
 *                 example: kg
 *     responses:
 *       201:
 *         description: Satuan berhasil dibuat
 */
router.post('/units', authenticateToken, authorizePermission('atribut-produk', 'create'), ctrl.createUnit);

/**
 * @swagger
 * /api/product-attributes/units/{id}:
 *   put:
 *     summary: Update satuan produk
 *     tags: [ProductAttributes]
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
 *               name:
 *                 type: string
 *               abbreviation:
 *                 type: string
 *     responses:
 *       200:
 *         description: Satuan berhasil diupdate
 *       404:
 *         description: Satuan tidak ditemukan
 */
router.put('/units/:id', authenticateToken, authorizePermission('atribut-produk', 'edit'), ctrl.updateUnit);

/**
 * @swagger
 * /api/product-attributes/units/{id}:
 *   delete:
 *     summary: Hapus satuan produk
 *     tags: [ProductAttributes]
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
 *         description: Satuan berhasil dihapus
 *       404:
 *         description: Satuan tidak ditemukan
 */
router.delete('/units/:id', authenticateToken, authorizePermission('atribut-produk', 'delete'), ctrl.deleteUnit);

export default router;
