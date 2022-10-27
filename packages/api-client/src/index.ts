import { FutureInstance, fork, promise } from 'fluture'
import {
  ApiConfiguration,
  createLocalStorageAuthStore,
  createInMemoryAuthStore,
  createDataLoader,
} from './common'

import { createAuthApi } from './auth'
import { createHealthApi } from './health'
import { createProjectApi } from './project'
import { createRecordingApi } from './recording'
import { createTeamApi } from './team'
import { createUserApi } from './user'

export function createApiClient(config: ApiConfiguration) {
  const authStore =
    config.authStorage === 'local-storage'
      ? createLocalStorageAuthStore()
      : createInMemoryAuthStore()
  const dataLoader = createDataLoader(authStore, config)

  const auth = createAuthApi(authStore, dataLoader)
  const health = createHealthApi(dataLoader)
  const project = createProjectApi(dataLoader)
  const recording = createRecordingApi(dataLoader)
  const team = createTeamApi(dataLoader)
  const user = createUserApi(dataLoader)

  function debug<R>(method: FutureInstance<unknown, R>) {
    return method.pipe(fork<unknown>(console.error)<R>(console.log))
  }

  function wrapP<R>(method: FutureInstance<unknown, R>) {
    return (method as FutureInstance<Error, R>).pipe(promise)
  }

  return {
    auth,
    health,
    project,
    recording,
    team,
    user,

    debug,
    wrapP,
  }
}

export type ApiClient = ReturnType<typeof createApiClient>
