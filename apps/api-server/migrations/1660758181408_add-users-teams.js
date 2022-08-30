/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
  pgm.createTable('users', {
    id: { type: 'uuid', primaryKey: true },
    teamId: { type: 'uuid', notNull: true, references: 'teams' },
    name: { type: 'text', notNull: true },
    email: { type: 'varchar(254)', notNull: true, unique: true },
    password: { type: 'text', notNull: true },
    resetToken: { type: 'char(32)', default: null },
    resetTokenExpiry: { type: 'timestamp', default: null },
  })

  pgm.createTable('teams', {
    id: { type: 'uuid', primaryKey: true },
    name: { type: 'text', notNull: true },
  })
}

exports.down = pgm => {
  pgm.dropTable('teams')
  pgm.dropTable('users')
}
