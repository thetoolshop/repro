import { Kysely, PostgresDialect } from 'kysely'
import { Pool } from 'pg'
import { Schema } from './schema'
import { Database } from './types'

interface Config {
  host: string
  port: number
  database: string
  user: string
  password: string
}

export function createPostgresDatabaseClient(config: Config): Database {
  return new Kysely<Schema>({
    dialect: new PostgresDialect({
      pool: new Pool({
        host: config.host,
        port: config.port,
        database: config.database,
        user: config.user,
        password: config.password,
      }),
    }),
  })
}
