/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

const MODULES = [
  { name: 'Point of Sale', slug: 'pos' },
  { name: 'Pengeluaran & Pemasukan', slug: 'pengeluaran-pemasukan' },
  { name: 'Pelanggan', slug: 'pelanggan' },
  { name: 'Produk', slug: 'produk' },
  { name: 'Atribut Produk', slug: 'atribut-produk' },
  { name: 'Stock Opname', slug: 'stock-opname' },
];

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.up = (pgm) => {
  MODULES.forEach(({ name, slug }) => {
    pgm.sql(`INSERT INTO modules (name, slug) VALUES ('${name}', '${slug}')`);
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  const slugs = MODULES.map((m) => `'${m.slug}'`).join(', ');
  pgm.sql(`DELETE FROM modules WHERE slug IN (${slugs})`);
};
