import pool from '../../config/db';
import logger from '../../utils/logger';

const modules = [
  { id: 1, name: 'Point of Sale', slug: 'pos' },
  { id: 2, name: 'Pengeluaran & Pemasukan', slug: 'pengeluaran-pemasukan' },
  { id: 3, name: 'Pelanggan', slug: 'pelanggan' },
  { id: 4, name: 'Produk', slug: 'produk' },
  { id: 5, name: 'Atribut Produk', slug: 'atribut-produk' },
  { id: 6, name: 'Stock Opname', slug: 'stock-opname' },
  { id: 7, name: 'Manajemen Pengguna', slug: 'users' },
  { id: 8, name: 'Keuangan & Akuntansi', slug: 'akuntansi' },
  { id: 9, name: 'Data Pemasok / Vendor', slug: 'pemasok' },
  { id: 10, name: 'Manajemen Stok & Opname', slug: 'stok' },
  { id: 13, name: 'Pembelian & PO', slug: 'pembelian' }
];

const actions = ['read', 'create', 'edit', 'delete', 'export', 'approve', 'pay', 'settings'];

const seedModulesAndPermissions = async () => {
  try {
    for (const mod of modules) {
      // Upsert module
      const res = await pool.query(
        `INSERT INTO modules (id, name, slug) VALUES ($1, $2, $3) 
         ON DUPLICATE KEY UPDATE name = VALUES(name), slug = VALUES(slug)`,
        [mod.id, mod.name, mod.slug]
      );
      
      const moduleId = mod.id;

      // Seed superadmin permissions (allow all)
      for (const action of actions) {
        await pool.query(
          `INSERT INTO role_permissions (role, module_id, action, allowed)
           VALUES ('superadmin', $1, $2, true)
           ON DUPLICATE KEY UPDATE allowed = VALUES(allowed)`,
          [moduleId, action]
        );
      }
    }

    logger.info('Modules and Superadmin Permissions seeded successfully!');
    process.exit(0);
  } catch (error) {
    logger.error('Error seeding modules', error);
    process.exit(1);
  }
};

seedModulesAndPermissions();
