import { Router } from 'express';
import * as outletController from '../controllers/outletController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Outlets
 *   description: API untuk manajemen outlet (multi-outlet)
 */

/**
 * @swagger
 * /api/outlets:
 *   post:
 *     summary: Buat outlet baru (hanya superadmin)
 *     tags: [Outlets]
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
 *               address:
 *                 type: string
 *               phone:
 *                 type: string
 *               logo_url:
 *                 type: string
 *               description:
 *                 type: string
 *               receipt_footer:
 *                 type: string
 *     responses:
 *       201:
 *         description: Outlet berhasil dibuat
 *       400:
 *         description: Input tidak valid
 *       403:
 *         description: Bukan superadmin
 */
router.post('/', authenticateToken, outletController.createOutlet);

/**
 * @swagger
 * /api/outlets:
 *   get:
 *     summary: Ambil daftar outlet (superadmin=semua; lainnya=outlet sendiri)
 *     tags: [Outlets]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Daftar outlet berhasil diambil
 */
router.get('/', authenticateToken, outletController.getOutlets);

/**
 * @swagger
 * /api/outlets/{id}:
 *   get:
 *     summary: Ambil detail outlet berdasarkan ID
 *     tags: [Outlets]
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
 *         description: Detail outlet
 *       403:
 *         description: Tidak memiliki akses ke outlet ini
 *       404:
 *         description: Outlet tidak ditemukan
 */
router.get('/:id', authenticateToken, outletController.getOutletById);

/**
 * @swagger
 * /api/outlets/{id}:
 *   put:
 *     summary: Update outlet (hanya owner/superadmin)
 *     tags: [Outlets]
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
 *               address:
 *                 type: string
 *               phone:
 *                 type: string
 *               logo_url:
 *                 type: string
 *               description:
 *                 type: string
 *               receipt_footer:
 *                 type: string
 *     responses:
 *       200:
 *         description: Outlet berhasil diupdate
 *       403:
 *         description: Bukan owner outlet
 *       404:
 *         description: Outlet tidak ditemukan
 */
router.put('/:id', authenticateToken, outletController.updateOutlet);

/**
 * @swagger
 * /api/outlets/{id}/users:
 *   get:
 *     summary: Ambil daftar user di outlet
 *     tags: [Outlets]
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
 *         description: Daftar user di outlet
 */
router.get('/:id/users', authenticateToken, outletController.getOutletUsers);

/**
 * @swagger
 * /api/outlets/{id}/users:
 *   post:
 *     summary: Tetapkan user ke outlet (hanya owner)
 *     tags: [Outlets]
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
 *             required:
 *               - user_id
 *             properties:
 *               user_id:
 *                 type: string
 *     responses:
 *       201:
 *         description: User berhasil ditetapkan ke outlet
 */
router.post('/:id/users', authenticateToken, outletController.assignUser);

/**
 * @swagger
 * /api/outlets/{id}/users/{userId}:
 *   delete:
 *     summary: Hapus user dari outlet (hanya owner)
 *     tags: [Outlets]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User berhasil dihapus dari outlet
 */
router.delete('/:id/users/:userId', authenticateToken, outletController.removeUser);

export default router;
