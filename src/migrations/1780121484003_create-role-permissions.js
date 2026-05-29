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
  pgm.createTable('role_permissions', {
    id: {
      type: 'serial',
      primaryKey: true,
    },
    role: { type: 'user_role', notNull: true },
    module_id: {
      type: 'integer',
      notNull: true,
      references: '"modules"',
      onDelete: 'CASCADE',
    },
    action: { type: 'permission_action', notNull: true },
    allowed: { type: 'boolean', notNull: true, default: false },
  });

  pgm.addConstraint(
    'role_permissions',
    'role_permissions_unique',
    'UNIQUE (role, module_id, action)'
  );
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropTable('role_permissions');
};
