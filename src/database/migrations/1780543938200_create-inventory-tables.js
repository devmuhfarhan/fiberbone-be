exports.shorthands = undefined;

exports.up = (pgm) => {
  // Enum for transaction type
  pgm.createType('inventory_transaction_type', ['IN', 'OUT', 'OPNAME']);

  // inventory_batches
  pgm.createTable('inventory_batches', {
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
    product_id: {
      type: 'uuid',
      notNull: true,
      references: '"products"',
      onDelete: 'CASCADE',
    },
    quantity: { type: 'integer', notNull: true }, // initial quantity
    quantity_available: { type: 'integer', notNull: true }, // remaining quantity
    unit_cost: { type: 'numeric(12,2)', notNull: true }, // cost per unit for this batch
    batch_date: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('current_timestamp'),
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

  // Index for FIFO sorting
  pgm.createIndex('inventory_batches', ['product_id', 'quantity_available', 'batch_date']);

  // inventory_transactions
  pgm.createTable('inventory_transactions', {
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
    product_id: {
      type: 'uuid',
      notNull: true,
      references: '"products"',
      onDelete: 'CASCADE',
    },
    type: {
      type: 'inventory_transaction_type',
      notNull: true,
    },
    quantity: { type: 'integer', notNull: true },
    total_cost: { type: 'numeric(12,2)', notNull: true, default: 0 }, // total cost of this transaction
    reference_type: { type: 'varchar(50)' }, // e.g. Sale, Purchase, Opname
    reference_id: { type: 'varchar(255)' },
    notes: { type: 'text' },
    created_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });
};

exports.down = (pgm) => {
  pgm.dropTable('inventory_transactions');
  pgm.dropIndex('inventory_batches', ['product_id', 'quantity_available', 'batch_date']);
  pgm.dropTable('inventory_batches');
  pgm.dropType('inventory_transaction_type');
};
