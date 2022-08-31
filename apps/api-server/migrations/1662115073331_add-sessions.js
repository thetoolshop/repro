/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
  pgm.createTable('sessions', {
    token: { type: 'char(32)', primaryKey: true },
    data: { type: 'jsonb', notNull: true },
    expires_at: { type: 'timestamp', notNull: true },
  })
};

exports.down = pgm => {
  pgm.dropTable('sessions')
};
