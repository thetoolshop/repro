import { S3 } from '@aws-sdk/client-s3'
import compression from 'compression'
import cors from 'cors'
import express, { ErrorRequestHandler } from 'express'
import { createTransport as createEmailTransport } from 'nodemailer'
import SMTPTransport from 'nodemailer/lib/smtp-transport'

import { env } from '~/config/env'

import { createAuthMiddleware } from '~/middleware/auth'

import { createDatabaseClient } from '~/providers/database'
import { createProjectProvider } from '~/providers/project'
import { createRecordingProvider } from '~/providers/recording'
import { createSessionProvider } from '~/providers/session'
import { createTeamProvider } from '~/providers/team'
import { createUserProvider } from '~/providers/user'

import { createAuthRouter } from '~/routers/auth'
import { createHealthcheckRouter } from '~/routers/health'
import { createProjectRouter } from '~/routers/project'
import { createRecordingRouter } from '~/routers/recording'
import { createTeamRouter } from '~/routers/team'
import { createUserRouter } from '~/routers/user'

import { createAuthService } from '~/services/auth'
import { createProjectService } from '~/services/project'
import { createRecordingService } from '~/services/recording'
import { createTeamService } from '~/services/team'
import { createUserService } from '~/services/user'

import { createCryptoUtils } from '~/utils/crypto'
import { createEmailUtils } from '~/utils/email'
import { createPaddleAdapter } from './adapters/paddle'
import { createBillingInfoRouter } from './routers/billing-info'
import { createBillingService } from './services/billing'
import { serverError } from './utils/errors'
import { createS3Utils } from './utils/s3'

const dbClient = createDatabaseClient({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_DATABASE,
  ssl: env.DB_USE_SSL ? true : false,
})

const emailTransporter = createEmailTransport({
  host: env.EMAIL_SMTP_HOST,
  port: env.EMAIL_SMTP_PORT,
  auth: env.EMAIL_SMTP_USE_CREDENTIALS && {
    user: env.EMAIL_SMTP_USER,
    pass: env.EMAIL_SMTP_PASS,
  },
} as SMTPTransport.Options)

const s3Client = new S3({
  forcePathStyle: true,
  endpoint: env.AWS_S3_ENDPOINT,
  region: env.AWS_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
})

const cryptoUtils = createCryptoUtils()
const emailUtils = createEmailUtils(emailTransporter, {
  fromEmail: env.EMAIL_FROM_ADDRESS,
  templateDirectory: env.EMAIL_TEMPLATE_DIRECTORY,
})

const s3Utils = createS3Utils(s3Client)

const paddleAdapter = createPaddleAdapter({
  vendorId: env.PADDLE_VENDOR_ID,
  apiKey: env.PADDLE_API_KEY,
  useSandbox: !!env.PADDLE_SANDBOX,
})

const projectProvider = createProjectProvider(dbClient)
const recordingProvider = createRecordingProvider(dbClient)
const sessionProvider = createSessionProvider(dbClient)
const teamProvider = createTeamProvider(dbClient)
const userProvider = createUserProvider(dbClient, cryptoUtils)

const authService = createAuthService(sessionProvider, cryptoUtils)
const billingService = createBillingService(paddleAdapter)
const projectService = createProjectService(projectProvider)
const recordingService = createRecordingService(recordingProvider)
const teamService = createTeamService(teamProvider)
const userService = createUserService(userProvider, emailUtils)

const authMiddleware = createAuthMiddleware(
  authService,
  teamService,
  userService
)

interface RouterConfig {
  middleware?: Array<express.RequestHandler>
  router: express.Router
}

function bootstrap(routers: Record<string, RouterConfig>) {
  const app = express()

  app.use(cors())
  app.use(express.json({ limit: '16mb' }))
  app.use(compression())

  for (const [path, config] of Object.entries(routers)) {
    app.use(path, ...(config.middleware ?? []), config.router)
  }

  const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    res.status(500).send(serverError(err.message))
  }

  app.use(errorHandler)

  app.listen(+env.PORT, () => {
    console.log(`API server listening on port ${env.PORT}`)
  })
}

bootstrap({
  '/health': {
    router: createHealthcheckRouter(),
  },

  '/auth': {
    router: createAuthRouter(
      authService,
      teamService,
      projectService,
      userService
    ),
  },

  '/billing-info': {
    router: createBillingInfoRouter(billingService),
  },

  '/projects': {
    middleware: [authMiddleware.requireSession],
    router: createProjectRouter(projectService),
  },

  '/recordings': {
    router: createRecordingRouter(
      projectService,
      recordingService,
      authMiddleware,
      s3Utils,
      { resourcesBucket: env.RESOURCES_BUCKET_NAME }
    ),
  },

  '/teams': {
    middleware: [authMiddleware.requireSession],
    router: createTeamRouter(teamService),
  },

  '/users': {
    middleware: [authMiddleware.requireSession],
    router: createUserRouter(userService),
  },
})
