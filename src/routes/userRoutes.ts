import { Router } from 'express';
import * as userController from '../controllers/userController';
import { authenticateToken } from '../middlewares/authMiddleware';
import { authorizePermission } from '../middlewares/roleMiddleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: API untuk manajemen pengguna
 */

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Mendapatkan daftar semua pengguna (dengan paginasi)
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Nomor halaman
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Jumlah data per halaman
 *     responses:
 *       200:
 *         description: Berhasil mengambil daftar pengguna
 *       401:
 *         description: Tidak ada token otentikasi
 *       403:
 *         description: Tidak memiliki akses
 */
router.get('/', authenticateToken, authorizePermission('users', 'read'), userController.getUsers);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Mendapatkan data pengguna spesifik berdasarkan ID
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: UUID dari pengguna
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan pengguna
 *       404:
 *         description: Pengguna tidak ditemukan
 */
router.get('/:id', authenticateToken, authorizePermission('users', 'read'), userController.getUserById);

export default router;
