import pool from '../../config/db';
import dotenv from 'dotenv';

dotenv.config();

const seedOutlet = async () => {
  try {
    console.log('Seeding master outlet...');

    // Ambil superadmin sebagai owner
    const adminResult = await pool.query(
      "SELECT id FROM users WHERE email = 'admin@fiberbone.com' AND role = 'superadmin' LIMIT 1"
    );

    if (adminResult.rows.length === 0) {
      console.error('Superadmin user not found. Please run seed:admin first.');
      process.exit(1);
    }

    const ownerId = adminResult.rows[0].id;

    // Cek apakah outlet sudah ada
    const existingOutlet = await pool.query(
      "SELECT id FROM outlets WHERE name = 'Fiberbone Pusat'"
    );

    if (existingOutlet.rows.length > 0) {
      console.log('Master outlet already exists.');
      process.exit(0);
    }

    const insertQuery = `
      INSERT INTO outlets (name, address, phone, description, receipt_footer, owner_id, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, name;
    `;

    const values = [
      'Fiberbone Pusat',
      'Jl. Sudirman No. 1, Jakarta Pusat, DKI Jakarta 10110',
      '021-55500001',
      'Outlet pusat jaringan internet Fiberbone.',
      'Terima kasih telah menggunakan layanan Fiberbone.',
      ownerId,
      true,
    ];

    const result = await pool.query(insertQuery, values);
    console.log(`Successfully created outlet: ${result.rows[0].name} (ID: ${result.rows[0].id})`);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding outlet:', error);
    process.exit(1);
  }
};

seedOutlet();
