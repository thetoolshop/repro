/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
  pgm.addColumns('recordings', {
    url: { type: 'text', notNull: true, default: '' }
  })
};

exports.down = pgm => {
  pgm.dropColumns('recordings', ['url'])
};
