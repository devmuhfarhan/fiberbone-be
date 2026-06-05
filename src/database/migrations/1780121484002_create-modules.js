/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.up = (pgm) => {
  // Enum untuk aksi yang bisa dilakukan pada setiap modul
  pgm.createType('permission_action', [
    'read',
    'create',
    'edit',
    'delete',
    'export',
    'approve',
    'pay',
    'settings',
  ]);

  // Tabel daftar modul/fitur aplikasi
  pgm.createTable('modules', {
    id: {
      type: 'serial',
      primaryKey: true,
    },
    name: { type: 'varchar(100)', notNull: true },
    slug: { type: 'varchar(100)', notNull: true, unique: true },
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropTable('modules');
  pgm.dropType('permission_action');
};
