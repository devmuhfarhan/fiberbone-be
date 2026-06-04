import { Router } from 'express';
import * as voucherController from '../controllers/voucherController';
import { authenticateToken } from '../middlewares/authMiddleware';
import { authorizePermission } from '../middlewares/roleMiddleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Vouchers
 *   description: API untuk manajemen voucher diskon
 */

/**
 * @swagger
 * /api/vouchers:
 *   get:
 *     summary: Ambil daftar voucher
 *     tags: [Vouchers]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mengambil data
 */
router.get('/', authenticateToken, authorizePermission('pelanggan', 'read'), voucherController.getVouchers);

/**
 * @swagger
 * /api/vouchers/{id}:
 *   get:
 *     summary: Ambil detail voucher
 *     tags: [Vouchers]
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
router.get('/:id', authenticateToken, authorizePermission('pelanggan', 'read'), voucherController.getVoucherById);

/**
 * @swagger
 * /api/vouchers:
 *   post:
 *     summary: Buat voucher baru
 *     tags: [Vouchers]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code, discount_type, discount_value]
 *             properties:
 *               customer_id:
 *                 type: string
 *               code:
 *                 type: string
 *               discount_type:
 *                 type: string
 *                 enum: [PERCENTAGE, FIXED]
 *               discount_value:
 *                 type: number
 *               valid_until:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Berhasil membuat voucher
 */
router.post('/', authenticateToken, authorizePermission('pelanggan', 'create'), voucherController.createVoucher);

/**
 * @swagger
 * /api/vouchers/{id}:
 *   put:
 *     summary: Update data voucher
 *     tags: [Vouchers]
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
 *               customer_id:
 *                 type: string
 *               discount_type:
 *                 type: string
 *                 enum: [PERCENTAGE, FIXED]
 *               discount_value:
 *                 type: number
 *               is_used:
 *                 type: boolean
 *               valid_until:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Berhasil update data
 */
router.put('/:id', authenticateToken, authorizePermission('pelanggan', 'edit'), voucherController.updateVoucher);

/**
 * @swagger
 * /api/vouchers/{id}:
 *   delete:
 *     summary: Hapus voucher
 *     tags: [Vouchers]
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
router.delete('/:id', authenticateToken, authorizePermission('pelanggan', 'delete'), voucherController.deleteVoucher);

export default router;
