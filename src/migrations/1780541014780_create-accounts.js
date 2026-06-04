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
  pgm.createType('account_type', ['Asset', 'Liability', 'Equity', 'Revenue', 'Expense']);
  pgm.createType('balance_type', ['Debit', 'Credit']);

  pgm.createTable('accounts', {
    id: {
      type: 'uuid',
      default: pgm.func('gen_random_uuid()'),
      primaryKey: true,
    },
    outlet_id: {
      type: 'uuid',
      notNull: true,
      references: '"outlets"',
      onDelete: 'CASCADE',
    },
    code: { type: 'varchar(50)', notNull: true },
    name: { type: 'varchar(255)', notNull: true },
    type: { type: 'account_type', notNull: true },
    balance_type: { type: 'balance_type', notNull: true },
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

  // Unique constraint for code per outlet
  pgm.addConstraint('accounts', 'unique_account_code_per_outlet', {
    unique: ['outlet_id', 'code'],
  });

  // Seed default accounts for existing outlets
  pgm.sql(`
    INSERT INTO accounts (id, outlet_id, code, name, type, balance_type)
    SELECT
      gen_random_uuid(),
      outlets.id as outlet_id,
      default_accounts.code,
      default_accounts.name,
      default_accounts.type::account_type,
      default_accounts.balance_type::balance_type
    FROM outlets
    CROSS JOIN (
      VALUES 
        ('1000', 'Kas & Bank', 'Asset', 'Debit'),
        ('1100', 'Piutang Usaha', 'Asset', 'Debit'),
        ('1200', 'Persediaan', 'Asset', 'Debit'),
        ('2000', 'Hutang Usaha', 'Liability', 'Credit'),
        ('3000', 'Modal', 'Equity', 'Credit'),
        ('4000', 'Pendapatan Penjualan', 'Revenue', 'Credit'),
        ('5000', 'Harga Pokok Penjualan', 'Expense', 'Debit'),
        ('6000', 'Biaya Operasional', 'Expense', 'Debit')
    ) AS default_accounts(code, name, type, balance_type);
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropTable('accounts');
  pgm.dropType('balance_type');
  pgm.dropType('account_type');
};
