import pool from '../../config/db';
import { v4 as uuidv4 } from 'uuid';
import logger from '../../utils/logger';

const seedOutlet = async () => {
  try {
    // Cari superadmin pertama
    const adminRes = await pool.query("SELECT id FROM users WHERE role = 'superadmin' LIMIT 1");
    if (adminRes.rows.length === 0) {
      throw new Error('No superadmin found. Please run seed:admin first.');
    }
    const adminId = adminRes.rows[0].id;

    const id = uuidv4();
    await pool.query(
      `INSERT INTO outlets (id, name, address, phone, owner_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, 'Fiberbone Main Outlet', 'Jl. Jenderal Sudirman No. 1', '081234567890', adminId]
    );

    logger.info('Outlet seeded successfully!');
    process.exit(0);
  } catch (error) {
    logger.error('Error seeding outlet', error);
    process.exit(1);
  }
};

seedOutlet();
