/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
  pgm.createTable('recording_events', {
    id: 'id',
    recording_id: { type: 'uuid', notNull: true, references: 'recordings', onDelete: 'cascade' },
    type: { type: 'smallint' },
    time: { type: 'integer', notNull: true },
    data: { type: 'jsonb', notNull: true }
  })
};

exports.down = pgm => {
  pgm.dropTable('recording_events')
};
