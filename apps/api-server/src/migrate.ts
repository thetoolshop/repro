import path from 'path'
import pg from 'pg'
import runner from 'node-pg-migrate'
import { env } from '~/config/env'

const dbClient = new pg.Client({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_DATABASE,
  ssl: env.DB_USE_SSL ? true : false,
})

async function main() {
  try {
    await dbClient.connect()

    await runner({
      migrationsTable: 'pgmigrations',
      dir: path.resolve(__dirname, '../migrations'),
      direction: 'up',
      dbClient,
    })

    process.exit(0)
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}

main()
