/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
  pgm.addColumns('recordings', {
    codec_version: { type: 'text', notNull: true, default: '1.0.0' }
  })
};

exports.down = pgm => {
  pgm.dropColumns('recordings', ['codec_version'])
};
