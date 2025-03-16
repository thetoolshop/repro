import compress from '@fastify/compress'
import cors from '@fastify/cors'
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
import { createProjectRouter } from '~/routers/project'
import { createRecordingRouter } from '~/routers/recording'
import { createStaffRouter } from '~/routers/staff'
import { createAccountService } from '~/services/account'
import { createHealthService } from '~/services/health'
import { createProjectService } from '~/services/project'
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
const staffAccountRouter = createStaffRouter(accountService)

const healthService = createHealthService(database, storage)
const healthRouter = createHealthRouter(healthService)

const projectService = createProjectService(database)
const recordingService = createRecordingService(database, storage)
const recordingRouter = createRecordingRouter(recordingService, accountService)
const projectRouter = createProjectRouter(
  projectService,
  recordingService,
  accountService
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
      process.env.NODE_ENV === 'production' ? 'https://admin.repro.dev' : true,
    credentials: true,
    allowedHeaders: ['Authorization', 'Content-Type'],
  })

  app.register(compress)

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
  '/account': staffAccountRouter,
  '/health': healthRouter,
  '/projects': projectRouter,
  '/recordings': recordingRouter,
})
