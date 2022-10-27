/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
  pgm.alterColumn('recordings', 'duration', {
    type: 'integer',
    notNull: true,
  })
};

exports.down = pgm => {
  pgm.alterColumn('recordings', 'duration', {
    type: 'bigint',
    notNull: true,
  })
};
