import { FutureInstance } from 'fluture'
import { DataLoader } from './common'

export interface HealthApi {
  check(): FutureInstance<Error, void>
}

export function createHealthApi(dataLoader: DataLoader) {
  function check(): FutureInstance<Error, void> {
    return dataLoader('/health')
  }

  return {
    check,
  }
}
