import pool from '../../config/db';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const seedNonsuperadminUsers = async () => {
  try {
    console.log('Seeding non-superadmin users...');

    // Ambil outlet pertama untuk di-assign ke user
    const outletResult = await pool.query('SELECT id, name FROM outlets LIMIT 1');
    if (outletResult.rows.length === 0) {
      console.log('No outlets found. Please run seed:outlet first.');
      process.exit(1);
    }
    const outletId = outletResult.rows[0].id;
    const outletName = outletResult.rows[0].name;
    console.log(`Will assign users to outlet: ${outletName} (ID: ${outletId})`);

    const roles = ['cashier', 'finance', 'operational'];
    const saltRounds = 10;
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    for (const role of roles) {
      const email = `${role}@fiberbone.com`;
      const fullname = `${role.charAt(0).toUpperCase() + role.slice(1)} User`;

      // Check if user already exists
      const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
      
      let userId;
      if (existingUser.rows.length > 0) {
        console.log(`User ${email} already exists.`);
        userId = existingUser.rows[0].id;
      } else {
        const insertQuery = `
          INSERT INTO users (fullname, email, password, is_active, role)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id;
        `;
        const values = [fullname, email, hashedPassword, true, role];
        const result = await pool.query(insertQuery, values);
        userId = result.rows[0].id;
        console.log(`Successfully created ${role} user: ${email}`);
      }

      // Assign to outlet
      const existingAssignment = await pool.query(
        'SELECT id FROM outlet_users WHERE outlet_id = $1 AND user_id = $2',
        [outletId, userId]
      );

      if (existingAssignment.rows.length === 0) {
        await pool.query(
          'INSERT INTO outlet_users (outlet_id, user_id) VALUES ($1, $2)',
          [outletId, userId]
        );
        console.log(`Assigned ${email} to outlet ${outletName}`);
      } else {
        console.log(`User ${email} is already assigned to outlet ${outletName}`);
      }
    }

    console.log('Seeding non-superadmin users completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding non-superadmin users:', error);
    process.exit(1);
  }
};

seedNonsuperadminUsers();
