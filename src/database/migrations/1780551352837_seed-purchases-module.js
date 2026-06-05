exports.shorthands = undefined;

exports.up = async (pgm) => {
  // Seed module for pembelian
  pgm.sql(`
    INSERT INTO modules (slug, name)
    VALUES ('pembelian', 'Pembelian & PO')
    ON CONFLICT (slug) DO NOTHING;
  `);

  // Permissions for superadmin
  pgm.sql(`
    INSERT INTO role_permissions (role, module_id, action, allowed)
    SELECT 'superadmin', m.id, unnest(ARRAY['read', 'create', 'edit', 'delete']::permission_action[]), true
    FROM modules m WHERE m.slug = 'pembelian'
    AND NOT EXISTS (
      SELECT 1 FROM role_permissions rp WHERE rp.role = 'superadmin' AND rp.module_id = m.id AND rp.action = 'read'
    );
  `);

  // Permissions for operational
  pgm.sql(`
    INSERT INTO role_permissions (role, module_id, action, allowed)
    SELECT 'operational', m.id, unnest(ARRAY['read', 'create', 'edit']::permission_action[]), true
    FROM modules m WHERE m.slug = 'pembelian'
    AND NOT EXISTS (
      SELECT 1 FROM role_permissions rp WHERE rp.role = 'operational' AND rp.module_id = m.id AND rp.action = 'read'
    );
  `);
};

exports.down = (pgm) => {
  pgm.sql(`DELETE FROM role_permissions WHERE module_id = (SELECT id FROM modules WHERE slug = 'pembelian');`);
  pgm.sql(`DELETE FROM modules WHERE slug = 'pembelian';`);
};
