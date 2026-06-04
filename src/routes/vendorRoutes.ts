import { Router } from 'express';
import * as vendorController from '../controllers/vendorController';
import { authenticateToken } from '../middlewares/authMiddleware';
import { authorizePermission } from '../middlewares/roleMiddleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Vendors
 *   description: API untuk manajemen vendor / pemasok
 */

/**
 * @swagger
 * /api/vendors:
 *   get:
 *     summary: Ambil daftar vendor
 *     tags: [Vendors]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mengambil data vendor
 */
router.get('/', authenticateToken, authorizePermission('pemasok', 'read'), vendorController.getVendors);

/**
 * @swagger
 * /api/vendors/{id}:
 *   get:
 *     summary: Ambil detail vendor
 *     tags: [Vendors]
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
 *         description: Berhasil mengambil detail vendor
 */
router.get('/:id', authenticateToken, authorizePermission('pemasok', 'read'), vendorController.getVendorById);

/**
 * @swagger
 * /api/vendors:
 *   post:
 *     summary: Buat vendor baru
 *     tags: [Vendors]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               contact_person:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *     responses:
 *       201:
 *         description: Vendor berhasil dibuat
 */
router.post('/', authenticateToken, authorizePermission('pemasok', 'create'), vendorController.createVendor);

/**
 * @swagger
 * /api/vendors/{id}:
 *   put:
 *     summary: Update data vendor
 *     tags: [Vendors]
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
 *               contact_person:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *     responses:
 *       200:
 *         description: Vendor berhasil diupdate
 */
router.put('/:id', authenticateToken, authorizePermission('pemasok', 'edit'), vendorController.updateVendor);

/**
 * @swagger
 * /api/vendors/{id}:
 *   delete:
 *     summary: Hapus data vendor
 *     tags: [Vendors]
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
 *         description: Vendor berhasil dihapus
 */
router.delete('/:id', authenticateToken, authorizePermission('pemasok', 'delete'), vendorController.deleteVendor);

export default router;
