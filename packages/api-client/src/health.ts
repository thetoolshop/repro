import { FutureInstance } from 'fluture'
import { DataLoader } from './common'

export function createHealthApi(dataLoader: DataLoader) {
  function check(): FutureInstance<Error, void> {
    return dataLoader('/health')
  }

  return {
    check,
  }
}

export type HealthApi = ReturnType<typeof createHealthApi>
