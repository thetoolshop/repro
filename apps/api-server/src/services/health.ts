import { both, FutureInstance, map } from 'fluture'
import { sql } from 'kysely'
import { attemptQuery, Database } from '~/modules/database'
import { Storage } from '~/modules/storage'

interface OK {
  status: 'ok'
}

export function createHealthService(db: Database, storage: Storage) {
  function check(): FutureInstance<Error, OK> {
    const dbCheck = attemptQuery(() => sql`SELECT 1`.execute(db))
    const storageCheck = storage.exists('.')

    return both(dbCheck)(storageCheck).pipe(
      map(() => ({ status: 'ok' }) as const)
    )
  }

  return {
    check,
  }
}

export type HealthService = ReturnType<typeof createHealthService>
