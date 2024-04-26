import { migrate } from '@blackglory/better-sqlite3-migrations'
import SQLiteDatabase from 'better-sqlite3'
import path from 'node:path'
import { defaultEnv as env } from '~/config/env'
import { getMigrations } from './getMigrations'

async function main() {
  const migrations = await getMigrations()
  const projectRoot = path.resolve(__dirname, '../..')
  const db = new SQLiteDatabase(path.join(projectRoot, env.DB_FILE))
  migrate(db, migrations)
}

main()
