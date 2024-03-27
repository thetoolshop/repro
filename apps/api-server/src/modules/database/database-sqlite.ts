import SQLiteDatabase, { Database as DatabaseT } from 'better-sqlite3'
import { Kysely, SqliteDialect } from 'kysely'
import { Schema } from './schema'
import { Database } from './types'

interface Config {
  path: string
}

export function createSQLiteDatabaseClient(
  configOrInstance: Config | DatabaseT
): Database {
  return new Kysely<Schema>({
    dialect: new SqliteDialect({
      database:
        configOrInstance instanceof SQLiteDatabase
          ? configOrInstance
          : new SQLiteDatabase(configOrInstance.path),
    }),
  })
}
