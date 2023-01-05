/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
  pgm.alterColumn('recording_events', 'data', {
    type: 'json',
    notNull: true,
  })
};

exports.down = pgm => {
  pgm.alterColumn('recording_events', 'data', {
    type: 'jsonb',
    notNull: true,
  })
};
