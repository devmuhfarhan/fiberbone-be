exports.shorthands = undefined;

exports.up = (pgm) => {
  // 1. Add payable_balance to vendors
  pgm.addColumn('vendors', {
    payable_balance: {
      type: 'numeric',
      notNull: true,
      default: 0
    }
  });

  // 2. Create purchases table
  pgm.createTable('purchases', {
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
    vendor_id: {
      type: 'uuid',
      notNull: true,
      references: '"vendors"',
      onDelete: 'RESTRICT',
    },
    po_number: {
      type: 'varchar(100)',
      notNull: true,
      unique: true,
    },
    date: {
      type: 'timestamp with time zone',
      notNull: true,
    },
    status: {
      type: 'varchar(50)',
      notNull: true,
      default: 'OTW', // 'OTW' | 'COMPLETED' | 'CANCELLED'
    },
    payment_method: {
      type: 'varchar(50)',
      notNull: true, // 'CASH' | 'TRANSFER' | 'HUTANG'
    },
    payment_account_id: {
      type: 'uuid',
      references: '"accounts"',
      onDelete: 'SET NULL',
    },
    total_amount: {
      type: 'numeric',
      notNull: true,
      default: 0,
    },
    notes: {
      type: 'text',
    },
    created_by: {
      type: 'uuid',
      references: '"users"',
      onDelete: 'SET NULL',
    },
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

  // 3. Create purchase_items table
  pgm.createTable('purchase_items', {
    id: {
      type: 'uuid',
      default: pgm.func('gen_random_uuid()'),
      primaryKey: true,
    },
    purchase_id: {
      type: 'uuid',
      notNull: true,
      references: '"purchases"',
      onDelete: 'CASCADE',
    },
    product_id: {
      type: 'uuid',
      notNull: true,
      references: '"products"',
      onDelete: 'RESTRICT',
    },
    quantity_ordered: {
      type: 'numeric',
      notNull: true,
    },
    quantity_received: {
      type: 'numeric',
      notNull: true,
      default: 0,
    },
    unit_cost: {
      type: 'numeric',
      notNull: true,
    },
    total_cost: {
      type: 'numeric',
      notNull: true,
    },
  });
};

exports.down = (pgm) => {
  pgm.dropTable('purchase_items');
  pgm.dropTable('purchases');
  pgm.dropColumn('vendors', 'payable_balance');
};
