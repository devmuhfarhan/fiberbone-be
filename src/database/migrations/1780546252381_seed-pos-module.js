exports.shorthands = undefined;

exports.up = async (pgm) => {
  // Seed module for pos
  pgm.sql(`
    INSERT INTO modules (slug, name)
    VALUES ('pos', 'Kasir & Penjualan')
    ON CONFLICT (slug) DO NOTHING;
  `);

  // Permissions for superadmin
  pgm.sql(`
    INSERT INTO role_permissions (role, module_id, action, allowed)
    SELECT 'superadmin', m.id, unnest(ARRAY['read', 'create', 'edit', 'delete']::permission_action[]), true
    FROM modules m WHERE m.slug = 'pos'
    AND NOT EXISTS (
      SELECT 1 FROM role_permissions rp WHERE rp.role = 'superadmin' AND rp.module_id = m.id AND rp.action = 'read'
    );
  `);

  // Permissions for operational (kasir)
  pgm.sql(`
    INSERT INTO role_permissions (role, module_id, action, allowed)
    SELECT 'operational', m.id, unnest(ARRAY['read', 'create']::permission_action[]), true
    FROM modules m WHERE m.slug = 'pos'
    AND NOT EXISTS (
      SELECT 1 FROM role_permissions rp WHERE rp.role = 'operational' AND rp.module_id = m.id AND rp.action = 'read'
    );
  `);

  // Add Potongan Penjualan account (4200) to all outlets
  pgm.sql(`
    INSERT INTO accounts (outlet_id, code, name, type, balance_type)
    SELECT id, '4200', 'Potongan Penjualan', 'Revenue', 'Debit'
    FROM outlets
    ON CONFLICT (outlet_id, code) DO NOTHING;
  `);
};

exports.down = (pgm) => {
  pgm.sql(`DELETE FROM role_permissions WHERE module_id = (SELECT id FROM modules WHERE slug = 'pos');`);
  pgm.sql(`DELETE FROM modules WHERE slug = 'pos';`);
};
