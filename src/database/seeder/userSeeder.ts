import pool from '../../config/db';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import logger from '../../utils/logger';

const seedUser = async () => {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('cashier123', salt);
    
    const id = uuidv4();
    await pool.query(
      'INSERT INTO users (id, fullname, email, password, is_active, role) VALUES ($1, $2, $3, $4, $5, $6)',
      [id, 'Cashier User', 'cashier@fiberbone.com', hashedPassword, true, 'cashier']
    );

    // Assign to first outlet
    const outletRes = await pool.query('SELECT id FROM outlets LIMIT 1');
    if (outletRes.rows.length > 0) {
      const outletId = outletRes.rows[0].id;
      const ouId = uuidv4();
      await pool.query(
        'INSERT INTO outlet_users (id, outlet_id, user_id) VALUES ($1, $2, $3)',
        [ouId, outletId, id]
      );
    }

    logger.info('User seeded successfully! Email: cashier@fiberbone.com | Password: cashier123');
    process.exit(0);
  } catch (error) {
    logger.error('Error seeding user', error);
    process.exit(1);
  }
};

seedUser();
