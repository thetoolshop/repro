/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
  pgm.addColumns('users', {
    verification_token: { type: 'char(32)', allowNull: true, unique: true },
    verified: { type: 'boolean', notNull: true, default: false },
  })
};

exports.down = pgm => {
  pgm.dropColumns('users', ['verification_token', 'verified'])
};
