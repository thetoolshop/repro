import SQLiteDatabase from 'better-sqlite3'
import { migrate } from '~/migrations/migrate'
import { createSQLiteDatabaseClient } from '~/modules/database'

export async function setUpTestDatabase() {
  const db = new SQLiteDatabase(':memory:')
  const client = createSQLiteDatabaseClient(db)

  await migrate(client)

  return {
    db: client,
    close: async () => {
      db.close()
    },
  }
}
