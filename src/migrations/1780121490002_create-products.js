/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
exports.up = (pgm) => {
  pgm.createTable('products', {
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
    category_id: {
      type: 'uuid',
      references: '"product_categories"',
      onDelete: 'SET NULL',
    },
    unit_id: {
      type: 'uuid',
      references: '"product_units"',
      onDelete: 'SET NULL',
    },
    name: { type: 'varchar(255)', notNull: true },
    description: { type: 'text' },
    price: { type: 'numeric(12,2)', notNull: true },        // harga jual
    cost_price: { type: 'numeric(12,2)' },                  // harga beli / modal
    stock: { type: 'integer', notNull: true, default: 0 },
    min_stock: { type: 'integer', notNull: true, default: 0 }, // batas minimum stok
    image_url: { type: 'varchar(500)' },
    is_active: { type: 'boolean', notNull: true, default: true },
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

  // Index untuk pencarian produk per outlet
  pgm.createIndex('products', ['outlet_id', 'is_active']);
  pgm.createIndex('products', ['outlet_id', 'name']);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
exports.down = (pgm) => {
  pgm.dropTable('products');
};
