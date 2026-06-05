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
  pgm.createTable('journal_items', {
    id: {
      type: 'uuid',
      default: pgm.func('gen_random_uuid()'),
      primaryKey: true,
    },
    journal_id: {
      type: 'uuid',
      notNull: true,
      references: '"journals"',
      onDelete: 'CASCADE',
    },
    account_id: {
      type: 'uuid',
      notNull: true,
      references: '"accounts"',
      onDelete: 'RESTRICT',
    },
    debit: { type: 'decimal(15,2)', notNull: true, default: 0 },
    credit: { type: 'decimal(15,2)', notNull: true, default: 0 },
    description: { type: 'text' },
    created_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
    updated_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropTable('journal_items');
};
