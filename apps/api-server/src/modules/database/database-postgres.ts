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

export function createPostgresDatabaseClient(
  configOrInstance: Config | Pool
): Database {
  return new Kysely<Schema>({
    dialect: new PostgresDialect({
      pool:
        configOrInstance instanceof Pool
          ? configOrInstance
          : new Pool({
              host: configOrInstance.host,
              port: configOrInstance.port,
              database: configOrInstance.database,
              user: configOrInstance.user,
              password: configOrInstance.password,
            }),
    }),
  })
}
