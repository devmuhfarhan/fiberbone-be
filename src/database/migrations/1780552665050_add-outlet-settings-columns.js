exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.addColumns('outlets', {
    description: {
      type: 'text',
      notNull: false,
    },
    receipt_footer: {
      type: 'text',
      notNull: false,
    },
  });
};

exports.down = (pgm) => {
  pgm.dropColumns('outlets', ['description', 'receipt_footer']);
};
