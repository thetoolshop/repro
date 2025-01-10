import caching from '@fastify/caching'
import compress from '@fastify/compress'
import cors from '@fastify/cors'
import fs from 'node:fs'
import path from 'node:path'

import fastify, { FastifyPluginAsync } from 'fastify'
import {
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod'
import { defaultEnv as env } from '~/config/env'
import { createSessionDecorator } from '~/decorators/session'
import { createSQLiteDatabaseClient } from '~/modules/database'
import { createSMTPEmailUtils } from '~/modules/email-utils'
import { createFileSystemStorageClient } from '~/modules/storage-fs'
import { createHealthRouter } from '~/routers/health'
import { createRecordingRouter } from '~/routers/recording'
import { createAccountService } from '~/services/account'
import { createHealthService } from '~/services/health'
import { createRecordingService } from '~/services/recording'
import { serverError } from '~/utils/errors'

const projectRoot = path.resolve(__dirname, '../..')

const database = createSQLiteDatabaseClient({
  path: path.join(projectRoot, env.DB_FILE),
})

const storage = createFileSystemStorageClient({
  path: path.join(projectRoot, env.STORAGE_DIR),
})

const emailUtils = createSMTPEmailUtils({
  smtpOptions: {
    host: env.EMAIL_SMTP_HOST,
    port: env.EMAIL_SMTP_PORT,
    secure: env.EMAIL_SMTP_SECURE,
    auth: {
      user: env.EMAIL_SMTP_USER,
      pass: env.EMAIL_SMTP_PASS,
    },
  },
  addresses: {
    'no-reply': 'no-reply@repro.dev',
  },
})

const accountService = createAccountService(database, emailUtils)

const healthService = createHealthService(database, storage)
const healthRouter = createHealthRouter(healthService)

const recordingService = createRecordingService(database, storage)
const recordingRouter = createRecordingRouter(recordingService, accountService)

const registerSessionDecorator = createSessionDecorator(accountService, env)

function bootstrap(routers: Record<string, FastifyPluginAsync>) {
  const app = fastify({
    bodyLimit: 16777216, // 16MiB
    http2: true,
    logger: true,
    https: {
      key: fs.readFileSync(
        path.isAbsolute(env.CERT_KEY_FILE)
          ? env.CERT_KEY_FILE
          : path.join(projectRoot, env.CERT_KEY_FILE)
      ),
      cert: fs.readFileSync(
        path.isAbsolute(env.CERT_FILE)
          ? env.CERT_FILE
          : path.join(projectRoot, env.CERT_FILE)
      ),
    },
  })

  app.addContentTypeParser('*', async () => {})

  app.register(cors, {
    origin:
      process.env.NODE_ENV === 'production' ? 'https://share.repro.dev' : true,
    credentials: true,
    allowedHeaders: ['Authorization', 'Content-Type'],
  })

  app.register(compress)

  app.register(caching, {
    privacy: caching.privacy.PUBLIC,
    expiresIn: 60 * 60 * 24 * 365,
  })

  app.setValidatorCompiler(validatorCompiler)
  app.setSerializerCompiler(serializerCompiler)

  registerSessionDecorator(app)

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
