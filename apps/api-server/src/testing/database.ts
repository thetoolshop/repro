import { migrate } from '@blackglory/better-sqlite3-migrations'
import SQLiteDatabase from 'better-sqlite3'
import { getMigrations } from '~/migrations/getMigrations'
import { createSQLiteDatabaseClient } from '~/modules/database'

export async function setUpTestDatabase() {
  const db = new SQLiteDatabase(':memory:')
  const migrations = await getMigrations()
  migrate(db, migrations)

  return {
    db: createSQLiteDatabaseClient(db),
    close: async () => {
      db.close()
    },
  }
}
