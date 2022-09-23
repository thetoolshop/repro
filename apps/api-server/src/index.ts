import express from 'express'

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

const app = express()

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

const projectProvider = createProjectProvider(dbClient)
const recordingProvider = createRecordingProvider(dbClient, {
  dataDirectory: env.RECORDING_DATA_DIRECTORY,
})
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
PublicRouter.use('/auth', createAuthRouter(authService, userService))

const PrivateRouter = express.Router()
PrivateRouter.use(authMiddleware.requireAuth)
PrivateRouter.use('/projects', createProjectRouter(projectService))
PrivateRouter.use(
  '/recordings',
  createRecordingRouter(projectService, recordingService)
)
PrivateRouter.use('/teams', createTeamRouter(teamService))
PrivateRouter.use('/users', createUserRouter(userService))

app.use(PublicRouter)
app.use(PrivateRouter)

app.listen(+env.PORT, () => {
  console.log(`API server listening on port ${env.PORT}`)
})
