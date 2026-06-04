/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.up = (pgm) => {
  // Insert module
  pgm.sql(`
    INSERT INTO modules (slug, name)
    VALUES ('akuntansi', 'Keuangan & Akuntansi')
    ON CONFLICT (slug) DO NOTHING;
  `);

  // Insert permissions for superadmin
  pgm.sql(`
    INSERT INTO role_permissions (role, module_id, action, allowed)
    SELECT 'superadmin', m.id, unnest(ARRAY['read', 'create', 'edit', 'delete', 'export']::permission_action[]), true
    FROM modules m WHERE m.slug = 'akuntansi'
    AND NOT EXISTS (
      SELECT 1 FROM role_permissions rp WHERE rp.role = 'superadmin' AND rp.module_id = m.id AND rp.action = 'read'
    );
  `);

  // Insert permissions for finance
  pgm.sql(`
    INSERT INTO role_permissions (role, module_id, action, allowed)
    SELECT 'finance', m.id, unnest(ARRAY['read', 'create', 'edit', 'export']::permission_action[]), true
    FROM modules m WHERE m.slug = 'akuntansi'
    AND NOT EXISTS (
      SELECT 1 FROM role_permissions rp WHERE rp.role = 'finance' AND rp.module_id = m.id AND rp.action = 'read'
    );
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.sql(`DELETE FROM role_permissions WHERE module_id = (SELECT id FROM modules WHERE slug = 'akuntansi');`);
  pgm.sql(`DELETE FROM modules WHERE slug = 'akuntansi';`);
};
