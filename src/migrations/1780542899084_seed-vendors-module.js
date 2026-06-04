exports.shorthands = undefined;

exports.up = (pgm) => {
  // Insert module
  pgm.sql(`
    INSERT INTO modules (slug, name)
    VALUES ('pemasok', 'Data Pemasok / Vendor')
    ON CONFLICT (slug) DO NOTHING;
  `);

  // Insert permissions for superadmin
  pgm.sql(`
    INSERT INTO role_permissions (role, module_id, action, allowed)
    SELECT 'superadmin', m.id, unnest(ARRAY['read', 'create', 'edit', 'delete']::permission_action[]), true
    FROM modules m WHERE m.slug = 'pemasok'
    AND NOT EXISTS (
      SELECT 1 FROM role_permissions rp WHERE rp.role = 'superadmin' AND rp.module_id = m.id AND rp.action = 'read'
    );
  `);
  
  // Insert permissions for operational
  pgm.sql(`
    INSERT INTO role_permissions (role, module_id, action, allowed)
    SELECT 'operational', m.id, unnest(ARRAY['read', 'create', 'edit']::permission_action[]), true
    FROM modules m WHERE m.slug = 'pemasok'
    AND NOT EXISTS (
      SELECT 1 FROM role_permissions rp WHERE rp.role = 'operational' AND rp.module_id = m.id AND rp.action = 'read'
    );
  `);
};

exports.down = (pgm) => {
  pgm.sql(`DELETE FROM role_permissions WHERE module_id = (SELECT id FROM modules WHERE slug = 'pemasok');`);
  pgm.sql(`DELETE FROM modules WHERE slug = 'pemasok';`);
};
