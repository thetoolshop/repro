import { Cancel, fork, FutureInstance, promise } from 'fluture'
import {
  ApiConfiguration,
  createDataLoader,
  createInMemoryAuthStore,
  createLocalStorageAuthStore,
} from './common'

import { AuthApi, createAuthApi } from './auth'
import { createHealthApi, HealthApi } from './health'
import { createProjectApi, ProjectApi } from './project'
import { createRecordingApi, RecordingApi } from './recording'
import { createTeamApi, TeamApi } from './team'
import { createUserApi, UserApi } from './user'

export interface ApiClient {
  auth: AuthApi
  health: HealthApi
  project: ProjectApi
  recording: RecordingApi
  team: TeamApi
  user: UserApi

  debug: <R>(method: FutureInstance<unknown, R>) => Cancel
  wrapP: <R>(method: FutureInstance<unknown, R>) => Promise<R>
}

export function createApiClient(config: ApiConfiguration): ApiClient {
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

export const defaultClient = createApiClient({
  baseUrl: process.env.REPRO_API_URL || '',
  authStorage: (process.env.AUTH_STORAGE as any) || 'local-storage',
})
