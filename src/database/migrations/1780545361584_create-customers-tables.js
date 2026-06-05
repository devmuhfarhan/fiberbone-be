exports.shorthands = undefined;

exports.up = (pgm) => {
  // Enum for discount type
  pgm.createType('discount_type', ['PERCENTAGE', 'FIXED']);

  // customers
  pgm.createTable('customers', {
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
    name: { type: 'varchar(255)', notNull: true },
    email: { type: 'varchar(255)' },
    phone: { type: 'varchar(50)' },
    address: { type: 'text' },
    receivable_balance: { type: 'numeric(12,2)', notNull: true, default: 0 }, // Piutang (Customer owing store)
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

  // vouchers
  pgm.createTable('vouchers', {
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
    customer_id: {
      type: 'uuid',
      references: '"customers"',
      onDelete: 'CASCADE', // Optional: link to specific customer
    },
    code: { type: 'varchar(50)', notNull: true }, // Voucher code
    discount_type: { type: 'discount_type', notNull: true },
    discount_value: { type: 'numeric(12,2)', notNull: true },
    is_used: { type: 'boolean', notNull: true, default: false },
    valid_until: { type: 'timestamp with time zone' },
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

  // ensure voucher code is unique per outlet
  pgm.addConstraint('vouchers', 'unique_outlet_voucher_code', {
    unique: ['outlet_id', 'code']
  });
};

exports.down = (pgm) => {
  pgm.dropTable('vouchers');
  pgm.dropTable('customers');
  pgm.dropType('discount_type');
};
