import { reject } from 'fluture'
import { createMiddleware } from '~/middleware'
import { Database } from '~/modules/database'
import { Storage } from '~/modules/storage'
import { createHealthService } from '~/services/health'
import { setUpTestDatabase } from '~/testing/database'
import { setUpTestStorage } from '~/testing/storage'
import { fromRouter } from '~/testing/utils'
import { serviceUnavailable } from '~/utils/errors'
import { createHealthRouter } from './health'

describe('Routers > Health', () => {
  let reset: () => Promise<void>
  let db: Database
  let storage: Storage

  beforeEach(async () => {
    const { db: dbInstance, close: closeDb } = await setUpTestDatabase()
    const { storage: storageInstance, close: closeStorage } =
      await setUpTestStorage()

    db = dbInstance
    storage = storageInstance

    reset = async () => {
      await closeDb()
      await closeStorage()
    }
  })

  afterEach(async () => {
    await reset()
  })

  it('should return 200 on a valid health check', async () => {
    const healthService = createHealthService(db, storage)
    const healthRouter = createHealthRouter(healthService, createMiddleware())
    const app = fromRouter(healthRouter)

    const res = await app.inject({
      method: 'GET',
      url: '/',
    })

    expect(res.headers['content-type']).toMatch(/json/)
    expect(res.statusCode).toEqual(200)
  })

  it('should return 503 on an invalid health check', async () => {
    const healthRouter = createHealthRouter(
      {
        check() {
          return reject(serviceUnavailable('Health check failed'))
        },
      },
      createMiddleware()
    )

    const app = fromRouter(healthRouter)
    const res = await app.inject({
      method: 'GET',
      url: '/',
    })

    expect(res.statusCode).toEqual(503)
  })
})
