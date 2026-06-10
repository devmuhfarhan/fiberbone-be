import pool from '../../config/db';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import logger from '../../utils/logger';

const seedAdmin = async () => {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('superadmin123', salt);
    
    const id = uuidv4();
    await pool.query(
      'INSERT INTO users (id, fullname, email, password, is_active, role) VALUES ($1, $2, $3, $4, $5, $6)',
      [id, 'Super Admin', 'admin@fiberbone.com', hashedPassword, true, 'superadmin']
    );

    logger.info('Admin seeded successfully! Email: admin@fiberbone.com | Password: superadmin123');
    process.exit(0);
  } catch (error) {
    logger.error('Error seeding admin', error);
    process.exit(1);
  }
};

seedAdmin();
