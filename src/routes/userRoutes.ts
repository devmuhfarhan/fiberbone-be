import { Router, Request, Response, NextFunction } from 'express';
import * as userController from '../controllers/userController';
import { authenticateToken, AuthRequest } from '../middlewares/authMiddleware';
import { authorizePermission, requireSuperadmin } from '../middlewares/roleMiddleware';
import { formatError } from '../utils/responseFormatter';

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
 * /api/users:
 *   post:
 *     summary: Membuat pengguna baru (Hanya Superadmin)
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullname
 *               - email
 *               - password
 *               - role
 *             properties:
 *               fullname:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [superadmin, cashier, finance, operational]
 *     responses:
 *       201:
 *         description: Berhasil membuat pengguna baru
 *       400:
 *         description: Validasi gagal atau email sudah digunakan
 *       403:
 *         description: Hanya superadmin yang diizinkan
 */
router.post('/', authenticateToken, requireSuperadmin, userController.createUser);

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

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Memperbarui data dasar pengguna (Hanya Superadmin)
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullname:
 *                 type: string
 *               email:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [superadmin, cashier, finance, operational]
 *     responses:
 *       200:
 *         description: Berhasil memperbarui pengguna
 *       400:
 *         description: Validasi gagal, email bentrok, atau mencoba mengedit superadmin lain
 *       403:
 *         description: Hanya superadmin yang diizinkan
 *       404:
 *         description: Pengguna tidak ditemukan
 */
router.put('/:id', authenticateToken, requireSuperadmin, userController.updateUser);

/**
 * @swagger
 * /api/users/{id}/status:
 *   put:
 *     summary: Mengubah status aktif/nonaktif pengguna (Hanya Superadmin)
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - is_active
 *             properties:
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Berhasil memperbarui status pengguna
 *       400:
 *         description: Mencoba menonaktifkan diri sendiri atau mengubah status superadmin lain
 *       403:
 *         description: Hanya superadmin yang diizinkan
 *       404:
 *         description: Pengguna tidak ditemukan
 */
router.put('/:id/status', authenticateToken, requireSuperadmin, userController.updateUserStatus);

/**
 * @swagger
 * /api/users/{id}/password:
 *   put:
 *     summary: Mereset/mengubah password pengguna (Hanya Superadmin)
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - new_password
 *             properties:
 *               new_password:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Berhasil mereset password
 *       400:
 *         description: Mencoba mereset password superadmin lain
 *       403:
 *         description: Hanya superadmin yang diizinkan
 *       404:
 *         description: Pengguna tidak ditemukan
 */
router.put('/:id/password', authenticateToken, requireSuperadmin, userController.resetPassword);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Menghapus pengguna secara permanen (Hanya Superadmin)
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
 *         description: Berhasil menghapus pengguna
 *       400:
 *         description: Mencoba menghapus diri sendiri atau mencoba menghapus superadmin
 *       403:
 *         description: Hanya superadmin yang diizinkan
 *       404:
 *         description: Pengguna tidak ditemukan
 */
router.delete('/:id', authenticateToken, requireSuperadmin, userController.deleteUser);

export default router;
