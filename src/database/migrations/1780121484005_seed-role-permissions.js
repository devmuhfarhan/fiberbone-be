/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

const ALL_ACTIONS = ['read', 'create', 'edit', 'delete', 'export', 'approve', 'pay', 'settings'];

/**
 * Matriks izin default:
 * - superadmin : semua modul, semua aksi
 * - cashier    : hanya pos, semua aksi
 * - finance    : hanya pengeluaran-pemasukan, semua aksi
 * - operational: produk, atribut-produk, stock-opname — semua aksi
 */
const PERMISSION_MATRIX = {
  superadmin: {
    'pos': ALL_ACTIONS,
    'pengeluaran-pemasukan': ALL_ACTIONS,
    'pelanggan': ALL_ACTIONS,
    'produk': ALL_ACTIONS,
    'atribut-produk': ALL_ACTIONS,
    'stock-opname': ALL_ACTIONS,
  },
  cashier: {
    'pos': ALL_ACTIONS,
  },
  finance: {
    'pengeluaran-pemasukan': ALL_ACTIONS,
  },
  operational: {
    'produk': ALL_ACTIONS,
    'atribut-produk': ALL_ACTIONS,
    'stock-opname': ALL_ACTIONS,
  },
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.up = async (pgm) => {
  for (const [role, modules] of Object.entries(PERMISSION_MATRIX)) {
    for (const [moduleSlug, actions] of Object.entries(modules)) {
      for (const action of actions) {
        pgm.sql(`
          INSERT INTO role_permissions (role, module_id, action, allowed)
          SELECT '${role}'::user_role, m.id, '${action}'::permission_action, true
          FROM modules m
          WHERE m.slug = '${moduleSlug}'
        `);
      }
    }
  }
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.sql(`DELETE FROM role_permissions`);
};
