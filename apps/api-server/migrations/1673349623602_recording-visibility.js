/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
  pgm.addColumns('recordings', {
    public: { type: 'boolean', notNull: true, default: false }
  })
};

exports.down = pgm => {
  pgm.dropColumns('recordings', ['public'])
};
