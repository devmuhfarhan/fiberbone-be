import pool from '../../config/db';
import logger from '../../utils/logger';
import { seedDefaultAccounts } from '../../models/accountModel';

const seedAccounts = async () => {
  try {
    const outletRes = await pool.query('SELECT id FROM outlets LIMIT 1');
    if (outletRes.rows.length === 0) {
      throw new Error('No outlets found. Please run seed:outlet first.');
    }
    const outletId = outletRes.rows[0].id;

    await seedDefaultAccounts(outletId);

    logger.info('Default accounts seeded successfully for the first outlet!');
    process.exit(0);
  } catch (error) {
    logger.error('Error seeding accounts', error);
    process.exit(1);
  }
};

seedAccounts();
