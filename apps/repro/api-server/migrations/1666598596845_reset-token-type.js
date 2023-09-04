/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
  pgm.alterColumn('users', 'reset_token', {
    type: 'char(32)',
    default: null,
    unique: true,
  })
};

exports.down = pgm => {
  pgm.alterColumn('users', 'reset_token', {
    type: 'uuid',
    default: null,
    unique: true,
  })
};
