import { Router } from 'express';
import * as authController from '../controllers/authController';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: API untuk otentikasi (Register, Login, Refresh, Logout)
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Mendaftarkan user baru
 *     tags: [Auth]
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
 *         description: Berhasil didaftarkan
 *       400:
 *         description: Input tidak valid atau email sudah terdaftar
 */
router.post('/register', authController.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login untuk mendapatkan access token & refresh token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Berhasil login, menerima cookie
 *         headers:
 *           Set-Cookie:
 *             schema:
 *               type: string
 *               example: accessToken=abcde12345; Path=/; HttpOnly
 *       401:
 *         description: Email atau password salah
 */
router.post('/login', authController.login);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout dan hapus cookie token
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Berhasil logout
 */
router.post('/logout', authController.logout);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Mendapatkan access token baru menggunakan refresh token
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Menerima cookie accessToken baru
 *       401:
 *         description: Refresh token tidak ada
 *       403:
 *         description: Refresh token tidak valid atau expired
 */
router.post('/refresh', authController.refresh);

export default router;
