/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
  pgm.createExtension('uuid-ossp')

  pgm.createTable('teams', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('uuid_generate_v4()') },
    name: { type: 'text', notNull: true },
  })

  pgm.createTable('users', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('uuid_generate_v4()') },
    team_id: { type: 'uuid', notNull: true, references: 'teams', onDelete: 'cascade' },
    name: { type: 'text', notNull: true },
    email: { type: 'varchar(254)', notNull: true, unique: true },
    password: { type: 'text', notNull: true },
    active: { type: 'boolean', notNull: true, default: true },
    reset_token: { type: 'uuid', default: null, unique: true },
    reset_token_expires_at: { type: 'timestamp', default: null },
  })

  pgm.createTable('invitations', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('uuid_generate_v4()') },
    team_id: { type: 'uuid', notNull: true, references: 'teams', onDelete: 'cascade' },
    email: { type: 'varchar(254)', notNull: true, unique: true },
    expires_at: { type: 'timestamp', notNull: true },
    active: { type: 'boolean', notNull: true, default: true },
  })
}

exports.down = pgm => {
  pgm.dropTable('invitations')
  pgm.dropTable('users')
  pgm.dropTable('teams')
  pgm.dropExtension('uuid-ossp')
}
