import { FutureInstance } from 'fluture'
import { Fetch } from './common'

export interface HealthApi {
  check(): FutureInstance<Error, void>
}

export function createHealthApi(fetch: Fetch) {
  function check(): FutureInstance<Error, void> {
    return fetch('/health')
  }

  return {
    check,
  }
}
