/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
  pgm.createTable('recording_resource_maps', {
    recording_id: { type: 'uuid', notNull: true, references: 'recordings', unique: true },
    resource_map: { type: 'json', notNull: true },
  })
};

exports.down = pgm => {
  pgm.dropTable('recording_resource_maps')
};
