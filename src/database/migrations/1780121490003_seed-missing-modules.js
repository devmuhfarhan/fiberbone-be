/**
 * Migration: tambah modul 'users' yang sebelumnya terlewat di seed awal.
 * Modul ini dipakai oleh userRoutes dan permissionRoutes.
 * 
 * Modul yang sudah ada (dari seed awal):
 *   pos, pengeluaran-pemasukan, pelanggan, produk, atribut-produk, stock-opname
 *
 * Modul yang ditambahkan di sini:
 *   users → manajemen pengguna & pengaturan RBAC (hanya superadmin)
 */
exports.shorthands = undefined;

const ALL_ACTIONS = ['read', 'create', 'edit', 'delete', 'export', 'approve', 'pay', 'settings'];

exports.up = async (pgm) => {
  // 1. Tambah modul 'users'
  pgm.sql(`INSERT INTO modules (name, slug) VALUES ('Manajemen Pengguna', 'users') ON CONFLICT (slug) DO NOTHING`);

  // 2. Beri superadmin semua izin di modul 'users'
  for (const action of ALL_ACTIONS) {
    pgm.sql(`
      INSERT INTO role_permissions (role, module_id, action, allowed)
      SELECT 'superadmin'::user_role, m.id, '${action}'::permission_action, true
      FROM modules m WHERE m.slug = 'users'
      ON CONFLICT (role, module_id, action) DO UPDATE SET allowed = true
    `);
  }
};

exports.down = (pgm) => {
  pgm.sql(`
    DELETE FROM role_permissions
    WHERE module_id = (SELECT id FROM modules WHERE slug = 'users')
  `);
  pgm.sql(`DELETE FROM modules WHERE slug = 'users'`);
};
