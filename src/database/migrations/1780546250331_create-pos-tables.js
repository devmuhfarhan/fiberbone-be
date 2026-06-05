exports.shorthands = undefined;

exports.up = (pgm) => {
  // Enum for sale status
  pgm.createType('sale_status', ['COMPLETED', 'PIUTANG', 'CANCELLED']);

  // sales
  pgm.createTable('sales', {
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
      onDelete: 'SET NULL',
    },
    voucher_id: {
      type: 'uuid',
      references: '"vouchers"',
      onDelete: 'SET NULL',
    },
    invoice_number: { type: 'varchar(50)', notNull: true },
    date: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
    subtotal: { type: 'numeric(12,2)', notNull: true, default: 0 },
    discount_amount: { type: 'numeric(12,2)', notNull: true, default: 0 },
    grand_total: { type: 'numeric(12,2)', notNull: true, default: 0 },
    payment_method: { type: 'varchar(50)', notNull: true }, // e.g., 'CASH', 'TRANSFER', 'PIUTANG'
    payment_account_id: {
      type: 'uuid',
      references: '"accounts"', // Which account receives the payment if not Piutang
      onDelete: 'SET NULL',
    },
    paid_amount: { type: 'numeric(12,2)', notNull: true, default: 0 },
    change_amount: { type: 'numeric(12,2)', notNull: true, default: 0 },
    status: { type: 'sale_status', notNull: true, default: 'COMPLETED' },
    notes: { type: 'text' },
    created_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  // Unique constraint for invoice number per outlet
  pgm.addConstraint('sales', 'unique_outlet_invoice_number', {
    unique: ['outlet_id', 'invoice_number']
  });

  // sale_items
  pgm.createTable('sale_items', {
    id: {
      type: 'uuid',
      default: pgm.func('gen_random_uuid()'),
      primaryKey: true,
    },
    sale_id: {
      type: 'uuid',
      notNull: true,
      references: '"sales"',
      onDelete: 'CASCADE',
    },
    product_id: {
      type: 'uuid',
      notNull: true,
      references: '"products"',
      onDelete: 'RESTRICT', // Don't allow deleting a product if it has sales history
    },
    quantity: { type: 'integer', notNull: true },
    unit_price: { type: 'numeric(12,2)', notNull: true }, // Selling price
    total_price: { type: 'numeric(12,2)', notNull: true }, // Qty * Unit Price
    total_cost: { type: 'numeric(12,2)', notNull: true }, // HPP from FIFO calculation
  });
};

exports.down = (pgm) => {
  pgm.dropTable('sale_items');
  pgm.dropTable('sales');
  pgm.dropType('sale_status');
};
