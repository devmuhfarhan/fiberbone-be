import { Router } from 'express';
import * as ctrl from '../controllers/productController';
import { authenticateToken } from '../middlewares/authMiddleware';
import { authorizePermission } from '../middlewares/roleMiddleware';
import { uploadProductImage } from '../config/upload';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: API untuk manajemen produk per outlet
 */

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Ambil daftar produk (dengan paginasi & pencarian)
 *     tags: [Products]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Cari berdasarkan nama produk
 *     responses:
 *       200:
 *         description: Daftar produk dengan metadata paginasi
 *       400:
 *         description: Tidak ada outlet aktif
 */
router.get('/', authenticateToken, authorizePermission('produk', 'read'), ctrl.getProducts);

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Ambil detail produk berdasarkan ID
 *     tags: [Products]
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
 *         description: Detail produk
 *       404:
 *         description: Produk tidak ditemukan
 */
router.get('/:id', authenticateToken, authorizePermission('produk', 'read'), ctrl.getProductById);

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Buat produk baru
 *     tags: [Products]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, price]
 *             properties:
 *               name:
 *                 type: string
 *               category_id:
 *                 type: string
 *               unit_id:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *                 description: Harga jual
 *               cost_price:
 *                 type: number
 *                 description: Harga beli / modal
 *               stock:
 *                 type: integer
 *                 default: 0
 *               min_stock:
 *                 type: integer
 *                 default: 0
 *               image_url:
 *                 type: string
 *     responses:
 *       201:
 *         description: Produk berhasil dibuat
 *       400:
 *         description: Input tidak valid
 */
router.post('/', authenticateToken, authorizePermission('produk', 'create'), ctrl.createProduct);

/**
 * @swagger
 * /api/products/upload-image:
 *   post:
 *     summary: Upload gambar produk
 *     tags: [Products]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: URL gambar yang berhasil diupload
 */
router.post('/upload-image', authenticateToken, authorizePermission('produk', 'create'), uploadProductImage.single('image'), ctrl.uploadProductImage);


/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Update produk
 *     tags: [Products]
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
 *               category_id:
 *                 type: string
 *               unit_id:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               cost_price:
 *                 type: number
 *               stock:
 *                 type: integer
 *               min_stock:
 *                 type: integer
 *               image_url:
 *                 type: string
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Produk berhasil diupdate
 *       404:
 *         description: Produk tidak ditemukan
 */
router.put('/:id', authenticateToken, authorizePermission('produk', 'edit'), ctrl.updateProduct);

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Hapus produk
 *     tags: [Products]
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
 *         description: Produk berhasil dihapus
 *       404:
 *         description: Produk tidak ditemukan
 */
router.delete('/:id', authenticateToken, authorizePermission('produk', 'delete'), ctrl.deleteProduct);

export default router;
