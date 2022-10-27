import cors from 'cors'
import express, { ErrorRequestHandler } from 'express'
import path from 'path'

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
import { serverError } from './utils/errors'

const app = express()

app.use(cors())
app.use(express.json({ limit: '16mb' }))

const dbClient = createDatabaseClient({
  connectionString: env.DATABASE_URL,
})

const cryptoUtils = createCryptoUtils()
const emailUtils = createEmailUtils({
  fromEmail: env.EMAIL_FROM_ADDRESS,
  sendGridApiKey: env.EMAIL_SENDGRID_API_KEY,
  templateDirectory: env.EMAIL_TEMPLATE_DIRECTORY,
})

const projectProvider = createProjectProvider(dbClient)
const recordingProvider = createRecordingProvider(dbClient)
const sessionProvider = createSessionProvider(dbClient)
const teamProvider = createTeamProvider(dbClient)
const userProvider = createUserProvider(dbClient, cryptoUtils)

const authService = createAuthService(sessionProvider, cryptoUtils)
const projectService = createProjectService(projectProvider)
const recordingService = createRecordingService(recordingProvider)
const teamService = createTeamService(teamProvider)
const userService = createUserService(userProvider, emailUtils)

const authMiddleware = createAuthMiddleware(
  authService,
  teamService,
  userService
)

const PublicRouter = express.Router()
PublicRouter.use('/health', createHealthcheckRouter())
PublicRouter.use(
  '/auth',
  createAuthRouter(authService, teamService, projectService, userService)
)

const PrivateRouter = express.Router()
PrivateRouter.use(authMiddleware.requireAuth)
PrivateRouter.use('/projects', createProjectRouter(projectService))
PrivateRouter.use(
  '/recordings',
  createRecordingRouter(projectService, recordingService, {
    recordingDataDirectory: path.resolve(
      __dirname,
      '..',
      env.RECORDING_DATA_DIRECTORY
    ),
  })
)
PrivateRouter.use('/teams', createTeamRouter(teamService))
PrivateRouter.use('/users', createUserRouter(userService))

app.use(PublicRouter)
app.use(PrivateRouter)

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  res.status(500).send(serverError(err.message))
}

app.use(errorHandler)

app.listen(+env.PORT, () => {
  console.log(`API server listening on port ${env.PORT}`)
})
