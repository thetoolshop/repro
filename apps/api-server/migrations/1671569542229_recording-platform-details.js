/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
  pgm.addColumns('recordings', {
    browser_name: { type: 'text', default: null },
    browser_version: { type: 'text', default: null },
    operating_system: { type: 'text', default: null },
  })
};

exports.down = pgm => {
  pgm.dropColumns('recordings', ['browser_name', 'browser_version', 'operating_system'])
};
