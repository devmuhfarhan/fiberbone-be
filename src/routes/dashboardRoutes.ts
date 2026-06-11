import { Router } from 'express';
import { authenticateToken } from '../middlewares/authMiddleware';
import * as dashboardController from '../controllers/dashboardController';

const router = Router();

/**
 * @swagger
 * /api/dashboard:
 *   get:
 *     summary: Ambil semua data ringkasan dashboard
 *     tags: [Dashboard]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Data dashboard berhasil diambil
 */
router.get('/', authenticateToken, dashboardController.getDashboardStats);

export default router;
