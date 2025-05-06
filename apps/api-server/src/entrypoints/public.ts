import caching from '@fastify/caching'
import compress from '@fastify/compress'
import cors from '@fastify/cors'

import fastify, { FastifyPluginAsync } from 'fastify'
import {
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod'
import { defaultEnv as env } from '~/config/env'
import { createSessionDecorator } from '~/decorators/session'
import { createPostgresDatabaseClient } from '~/modules/database/database-postgres'
import { createSMTPEmailUtils } from '~/modules/email-utils'
import { createS3StorageClient } from '~/modules/storage-s3'
import { createHealthRouter } from '~/routers/health'
import { createRecordingRouter } from '~/routers/recording'
import { createAccountService } from '~/services/account'
import { createHealthService } from '~/services/health'
import { createRecordingService } from '~/services/recording'
import { serverError } from '~/utils/errors'

const database = createPostgresDatabaseClient({
  host: env.DB_HOST,
  port: env.DB_PORT,
  database: env.DB_NAME,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
})

const storage = createS3StorageClient({
  endpoint: env.STORAGE_ENDPOINT,
  region: env.STORAGE_REGION,
  bucket: env.STORAGE_BUCKET,
  accessKeyId: env.STORAGE_ACCESS_KEY_ID,
  secretAccessKey: env.STORAGE_SECRET_ACCESS_KEY,
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
const recordingRouter = createRecordingRouter(
  recordingService,
  accountService,
  {
    debug: true,
  }
)

const registerSessionDecorator = createSessionDecorator(accountService, env)

function bootstrap(routers: Record<string, FastifyPluginAsync>) {
  const app = fastify({
    bodyLimit: 16777216, // 16MiB
    logger: true,
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
