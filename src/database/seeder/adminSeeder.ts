import pool from '../../config/db';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const seedAdminUser = async () => {
  try {
    console.log('Seeding administrator user...');

    // Check if superadmin already exists
    const existingAdmin = await pool.query('SELECT * FROM users WHERE email = $1', ['admin@fiberbone.com']);
    
    if (existingAdmin.rows.length > 0) {
      console.log('Administrator user already exists.');
      process.exit(0);
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash('admin123', saltRounds);

    const insertQuery = `
      INSERT INTO users (fullname, email, password, is_active, role)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, email;
    `;
    
    const values = ['Administrator', 'admin@fiberbone.com', hashedPassword, true, 'superadmin'];
    
    const result = await pool.query(insertQuery, values);
    
    console.log(`Successfully created administrator user: ${result.rows[0].email}`);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding administrator user:', error);
    process.exit(1);
  }
};

seedAdminUser();
