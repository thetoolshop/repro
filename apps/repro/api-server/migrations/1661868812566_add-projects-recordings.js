/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
  pgm.createTable('projects', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('uuid_generate_v4()') },
    name: { type: 'text', notNull: true },
    team_id: { type: 'uuid', notNull: true, references: 'teams', onDelete: 'cascade' },
    active: { type: 'boolean', notNull: true, default: true },
  })

  pgm.createType('project_role', ['admin', 'member'])

  pgm.createTable('projects_users', {
    project_id: { type: 'uuid', notNull: true, references: 'projects', onDelete: 'cascade' },
    user_id: { type: 'uuid', notNull: true, references: 'users', onDelete: 'cascade' },
    role: { type: 'project_role', notNull: true, default: 'member' },
  })

  pgm.createIndex('projects_users', ['project_id', 'user_id'], { unique: true })

  pgm.createTable('recordings', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('uuid_generate_v4()') },
    title: { type: 'text', notNull: true },
    description: { type: 'text', notNull: true },
    mode: { type: 'smallint', notNull: true },
    duration: { type: 'bigint', notNull: true },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
    team_id: { type: 'uuid', notNull: true, references: 'teams', onDelete: 'cascade' },
    project_id: { type: 'uuid', notNull: true, references: 'projects', onDelete: 'cascade' },
    author_id: { type: 'uuid', notNull: true, references: 'users', onDelete: 'cascade' },
  })
};

exports.down = pgm => {
  pgm.dropTable('recordings')
  pgm.dropTable('projects_users')
  pgm.dropType('project_role')
  pgm.dropTable('projects')
};
