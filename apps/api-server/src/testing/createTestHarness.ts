import { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { Env, createEnv } from '~/config/createEnv'
import { createSessionDecorator } from '~/decorators/session'
import { Database } from '~/modules/database'
import { SendParams, createStubEmailUtils } from '~/modules/email-utils'
import { Storage } from '~/modules/storage'
import { createAccountService } from '~/services/account'
import { createProjectService } from '~/services/project'
import { createRecordingService } from '~/services/recording'
import { setUpTestDatabase } from './database'
import { loadFixtures } from './loadFixtures'
import { setUpTestStorage } from './storage'
import { Fixture, FixtureArrayToValues, Services } from './types'
import { fromRouter } from './utils'

export interface Harness {
  db: Database
  storage: Storage
  env: Env
  services: Services

  bootstrap(router: FastifyPluginAsync): FastifyInstance
  // expectEmailToHaveBeenSent(params: SendParams): void
  loadFixtures<T extends Array<Fixture<unknown>>>(
    fixtures: [...T]
  ): Promise<FixtureArrayToValues<T>>
  reset(): Promise<void>
}

export async function createTestHarness(): Promise<Harness> {
  const env = createEnv({
    STORAGE_DIR: '',
    CERT_FILE: '',
    CERT_KEY_FILE: '',
  })

  const { db, close: closeDb } = await setUpTestDatabase()
  const { storage, close: closeStorage } = await setUpTestStorage()

  const emailLog: Array<SendParams> = []
  const emailUtils = createStubEmailUtils(emailLog)

  const reset = async () => {
    await closeDb()
    await closeStorage()
    emailLog.length = 0
  }

  const accountService = createAccountService(db, emailUtils)
  const projectService = createProjectService(db)
  const recordingService = createRecordingService(db, storage)

  const services = {
    accountService,
    projectService,
    recordingService,
  }

  const sessionDecorator = createSessionDecorator(accountService, env)

  function bootstrap(router: FastifyPluginAsync) {
    return fromRouter(router, [sessionDecorator])
  }

  const curriedLoadFixtures = loadFixtures.bind(
    loadFixtures,
    services
  ) as unknown as <T extends Array<Fixture<unknown>>>(
    fixtures: [...T]
  ) => Promise<FixtureArrayToValues<T>>

  // function expectEmailToHaveBeenSent(expected: Partial<SendParams>) {
  //   return
  // }

  return {
    env,
    db,
    services,
    storage,

    bootstrap,
    // expectEmailToHaveBeenSent,
    loadFixtures: curriedLoadFixtures,
    reset,
  }
}
