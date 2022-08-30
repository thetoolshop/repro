import dotenv from 'dotenv'

dotenv.config()

import express from 'express'
import { getEnv } from '@/config/env'
import { createAuthMiddleware } from '@/middleware/auth'
import { createDatabaseClient } from '@/providers/database'
import { createUserProvider } from '@/providers/user'
import { createAuthRouter } from '@/routers/auth'
import { createHealthcheckRouter } from '@/routers/health'
import { createRecordingRouter } from '@/routers/recording'
import { createAuthService } from '@/services/auth'
import { createRecordingService } from '@/services/recording'
import { createUserService } from '@/services/user'
import { createCryptoUtils } from '@/utils/crypto'
import { createEmailUtils } from '@/utils/email'
import { createRecordingProvider } from './providers/recording'

const app = express()
const env = getEnv(process.env)

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const dbClient = createDatabaseClient({
  connectionString: env.DATABASE_URL,
})

const cryptoUtils = createCryptoUtils()
const emailUtils = createEmailUtils({
  fromEmail: env.EMAIL_FROM_ADDRESS,
  sendGridApiKey: env.EMAIL_SENDGRID_API_KEY,
  templateDirectory: env.EMAIL_TEMPLATE_DIRECTORY,
})

const recordingProvider = createRecordingProvider(dbClient, {
  dataDirectory: env.RECORDING_DATA_DIRECTORY,
})
const userProvider = createUserProvider(dbClient, cryptoUtils)

const authService = createAuthService({
  sessionSecret: env.AUTH_SESSION_SECRET,
})
const recordingService = createRecordingService(recordingProvider)
const userService = createUserService(userProvider, emailUtils)
const authMiddleware = createAuthMiddleware(authService, userService)

const PublicRouter = express.Router()
PublicRouter.use('/health', createHealthcheckRouter())
PublicRouter.use('/auth', createAuthRouter(authService, userService))

const PrivateRouter = express.Router()
PrivateRouter.use(authMiddleware.requireAuth)
PrivateRouter.use('/recordings', createRecordingRouter(recordingService))

app.use(PublicRouter)
app.use(PrivateRouter)

app.listen(+env.PORT, () => {
  console.log(`API server listening on port ${env.PORT}`)
})
