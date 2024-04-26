import { findMigrationFilenames, readMigrationFile } from 'migration-files'
import path from 'node:path'

export async function getMigrations() {
  const filenames = await findMigrationFilenames(path.resolve(__dirname))
  return await Promise.all(filenames.map(readMigrationFile))
}
