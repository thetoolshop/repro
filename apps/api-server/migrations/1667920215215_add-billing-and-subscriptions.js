/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
  pgm.createTable('team_subscriptions', {
    team_id: { type: 'uuid', notNull: true, references: 'teams', unique: true },
    plan_name: { type: 'text', notNull: true },
    is_paid_plan: { type: 'boolean', notNull: true },
    min_seats: { type: 'integer', notNull: true, default: 0 },
    max_seats: { type: 'integer' },
    upload_limit: { type: 'integer' },
    vendor_plan_id: { type: 'integer' },
    vendor_user_id: { type: 'integer' },
    vendor_status: { type: 'text' },
    vendor_expires_at: { type: 'timestamp' },
  })

  pgm.createIndex('team_subscriptions', 'vendor_plan_id')
  pgm.createIndex('team_subscriptions', 'vendor_user_id')
};

exports.down = pgm => {
  pgm.dropIndex('team_subscriptions', 'vendor_user_id')
  pgm.dropIndex('team_subscriptions', 'vendor_plan_id')
  pgm.dropTable('team_subscriptions')
};
