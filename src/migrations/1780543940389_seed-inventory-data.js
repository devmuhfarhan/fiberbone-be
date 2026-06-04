exports.shorthands = undefined;

exports.up = async (pgm) => {
  // 1. Seed module for stok
  pgm.sql(`
    INSERT INTO modules (slug, name)
    VALUES ('stok', 'Manajemen Stok & Opname')
    ON CONFLICT (slug) DO NOTHING;
  `);

  // Permissions for superadmin
  pgm.sql(`
    INSERT INTO role_permissions (role, module_id, action, allowed)
    SELECT 'superadmin', m.id, unnest(ARRAY['read', 'create', 'edit', 'delete']::permission_action[]), true
    FROM modules m WHERE m.slug = 'stok'
    AND NOT EXISTS (
      SELECT 1 FROM role_permissions rp WHERE rp.role = 'superadmin' AND rp.module_id = m.id AND rp.action = 'read'
    );
  `);

  // Permissions for operational
  pgm.sql(`
    INSERT INTO role_permissions (role, module_id, action, allowed)
    SELECT 'operational', m.id, unnest(ARRAY['read', 'create']::permission_action[]), true
    FROM modules m WHERE m.slug = 'stok'
    AND NOT EXISTS (
      SELECT 1 FROM role_permissions rp WHERE rp.role = 'operational' AND rp.module_id = m.id AND rp.action = 'read'
    );
  `);

  // 2. Add Accounts 4100 & 6100 to all existing outlets
  pgm.sql(`
    INSERT INTO accounts (outlet_id, code, name, type, balance_type)
    SELECT id, '4100', 'Pendapatan Penyesuaian Persediaan', 'Revenue', 'Credit'
    FROM outlets
    ON CONFLICT (outlet_id, code) DO NOTHING;
  `);

  pgm.sql(`
    INSERT INTO accounts (outlet_id, code, name, type, balance_type)
    SELECT id, '6100', 'Beban Kerugian Persediaan', 'Expense', 'Debit'
    FROM outlets
    ON CONFLICT (outlet_id, code) DO NOTHING;
  `);

  // 3. Migrate initial inventory batches from products.stock
  pgm.sql(`
    INSERT INTO inventory_batches (outlet_id, product_id, quantity, quantity_available, unit_cost)
    SELECT outlet_id, id, stock, stock, COALESCE(cost_price, 0)
    FROM products
    WHERE stock > 0
  `);
};

exports.down = (pgm) => {
  pgm.sql(`DELETE FROM inventory_batches WHERE id IN (SELECT id FROM inventory_batches)`); // This is not completely reversible if data changed, but ok for down.
  pgm.sql(`DELETE FROM accounts WHERE code IN ('4100', '6100')`);
  pgm.sql(`DELETE FROM role_permissions WHERE module_id = (SELECT id FROM modules WHERE slug = 'stok');`);
  pgm.sql(`DELETE FROM modules WHERE slug = 'stok';`);
};
