import { FutureInstance, fork } from 'fluture'
import {
  ApiConfiguration,
  createLocalStorageAuthStore,
  createInMemoryAuthStore,
  createDataLoader,
} from '~/common'

import { createAuthApi } from '~/auth'
import { createProjectApi } from '~/project'
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
  const project = createProjectApi(dataLoader)
  const recording = createRecordingApi(dataLoader)
  const team = createTeamApi(dataLoader)
  const user = createUserApi(dataLoader)

  function run<R>(method: FutureInstance<unknown, R>) {
    return method.pipe(fork<unknown>(console.error)<R>(console.log))
  }

  return {
    auth,
    project,
    recording,
    team,
    user,
    run,
  }
}

export type ApiClient = ReturnType<typeof createApiClient>
