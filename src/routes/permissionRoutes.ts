import { Router } from 'express';
import * as permissionController from '../controllers/permissionController';
import { authenticateToken } from '../middlewares/authMiddleware';
import { authorizePermission } from '../middlewares/roleMiddleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Permissions
 *   description: API untuk manajemen matriks izin RBAC (hanya superadmin)
 */

/**
 * @swagger
 * /api/permissions/{role}:
 *   get:
 *     summary: Ambil matriks izin untuk role tertentu
 *     tags: [Permissions]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: role
 *         required: true
 *         schema:
 *           type: string
 *           enum: [superadmin, cashier, finance, operational]
 *     responses:
 *       200:
 *         description: Matriks izin berhasil diambil
 *       400:
 *         description: Role tidak valid
 *       403:
 *         description: Bukan superadmin
 */
router.get(
  '/:role',
  authenticateToken,
  authorizePermission('users', 'settings'),
  permissionController.getPermissionMatrix
);

/**
 * @swagger
 * /api/permissions/{role}:
 *   put:
 *     summary: Update satu izin pada role tertentu
 *     tags: [Permissions]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: role
 *         required: true
 *         schema:
 *           type: string
 *           enum: [superadmin, cashier, finance, operational]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - module
 *               - action
 *               - allowed
 *             properties:
 *               module:
 *                 type: string
 *                 example: pelanggan
 *               action:
 *                 type: string
 *                 enum: [read, create, edit, delete, export, approve, pay, settings]
 *               allowed:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Izin berhasil diupdate
 *       400:
 *         description: Input tidak valid
 *       403:
 *         description: Bukan superadmin
 */
router.put(
  '/:role',
  authenticateToken,
  authorizePermission('users', 'settings'),
  permissionController.updatePermission
);

export default router;
