import compress from '@fastify/compress'
import cors from '@fastify/cors'
import fs from 'node:fs'
import path from 'node:path'

import fastify, { FastifyPluginAsync } from 'fastify'
import { defaultEnv as env } from './config/env'
import { createMiddleware } from './middleware'
import { createSQLiteDatabaseClient } from './modules/database'
import { createFileSystemStorageClient } from './modules/storage-fs'
import { createHealthRouter } from './routers/health'
import { createRecordingRouter } from './routers/recording'
import { createHealthService } from './services/health'
import { createRecordingService } from './services/recording'
import { serverError } from './utils/errors'

const projectRoot = path.resolve(__dirname, '..')

const database = createSQLiteDatabaseClient({
  path: path.join(projectRoot, env.DB_FILE),
})

const storage = createFileSystemStorageClient({
  path: path.join(projectRoot, env.STORAGE_DIR),
})

const middleware = createMiddleware()

const healthService = createHealthService(database, storage)
const healthRouter = createHealthRouter(healthService, middleware)

const recordingService = createRecordingService(database, storage)
const recordingRouter = createRecordingRouter(recordingService, middleware)

function bootstrap(routers: Record<string, FastifyPluginAsync>) {
  const app = fastify({
    bodyLimit: 16777216, // 16MiB
    http2: true,
    logger: true,
    https: {
      key: fs.readFileSync(path.join(projectRoot, env.CERT_KEY_FILE)),
      cert: fs.readFileSync(path.join(projectRoot, env.CERT_FILE)),
    },
  })

  app.addContentTypeParser('*', async () => {})

  app.register(cors)
  app.register(compress)

  for (const [path, callback] of Object.entries(routers)) {
    app.register(callback, { prefix: path })
  }

  app.setErrorHandler((err, _req, res) => {
    res.status(500).send(serverError(err.message))
  })

  app.listen(
    {
      host: env.HOST,
      port: +env.PORT,
    },
    err => {
      if (err) {
        // @ts-ignore
        // fastify.log.error(err)
        console.error(err)
        process.exit(1)
      }
    }
  )
}

bootstrap({
  '/health': healthRouter,
  '/recordings': recordingRouter,
})
