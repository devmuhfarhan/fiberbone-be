import { Router } from 'express';
import * as customerController from '../controllers/customerController';
import { authenticateToken } from '../middlewares/authMiddleware';
import { authorizePermission } from '../middlewares/roleMiddleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Customers
 *   description: API untuk manajemen pelanggan
 */

/**
 * @swagger
 * /api/customers:
 *   get:
 *     summary: Ambil daftar pelanggan
 *     tags: [Customers]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mengambil data
 */
router.get('/', authenticateToken, authorizePermission('pelanggan', 'read'), customerController.getCustomers);

/**
 * @swagger
 * /api/customers/{id}:
 *   get:
 *     summary: Ambil detail pelanggan
 *     tags: [Customers]
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
 *         description: Berhasil mengambil data
 */
router.get('/:id', authenticateToken, authorizePermission('pelanggan', 'read'), customerController.getCustomerById);

/**
 * @swagger
 * /api/customers:
 *   post:
 *     summary: Buat pelanggan baru
 *     tags: [Customers]
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
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *     responses:
 *       201:
 *         description: Berhasil membuat pelanggan
 */
router.post('/', authenticateToken, authorizePermission('pelanggan', 'create'), customerController.createCustomer);

/**
 * @swagger
 * /api/customers/{id}:
 *   put:
 *     summary: Update data pelanggan
 *     tags: [Customers]
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
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *     responses:
 *       200:
 *         description: Berhasil update data
 */
router.put('/:id', authenticateToken, authorizePermission('pelanggan', 'edit'), customerController.updateCustomer);

/**
 * @swagger
 * /api/customers/{id}:
 *   delete:
 *     summary: Hapus pelanggan
 *     tags: [Customers]
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
 *         description: Berhasil menghapus
 */
router.delete('/:id', authenticateToken, authorizePermission('pelanggan', 'delete'), customerController.deleteCustomer);

export default router;
