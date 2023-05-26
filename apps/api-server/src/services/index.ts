import { createTransport as createEmailTransport } from 'nodemailer'
import SMTPTransport from 'nodemailer/lib/smtp-transport'

import { createDatabaseClient } from '~/providers/database'
import { createProjectProvider } from '~/providers/project'
import { createRecordingProvider } from '~/providers/recording'
import { createSessionProvider } from '~/providers/session'
import { createTeamProvider } from '~/providers/team'
import { createUserProvider } from '~/providers/user'

import { createCryptoUtils } from '~/utils/crypto'
import { createEmailUtils } from '~/utils/email'

import { createAuthService } from './auth'
import { createProjectService } from './project'
import { createRecordingService } from './recording'
import { createTeamService } from './team'
import { createUserService } from './user'

interface Config {
  database: {
    host: string
    port: number
    user: string
    password: string
    database: string
    ssl: boolean
  }

  email: {
    host: string
    port: number
    auth: false | { user: string; pass: string }
    fromAddress: string
    templateDirectory: string
  }
}

export function createServices(config: Config) {
  const dbClient = createDatabaseClient(config.database)

  const emailTransport = createEmailTransport(
    config.email as SMTPTransport.Options
  )

  const emailUtils = createEmailUtils(emailTransport, {
    fromEmail: config.email.fromAddress,
    templateDirectory: config.email.templateDirectory,
  })

  const cryptoUtils = createCryptoUtils()

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

  return {
    authService,
    projectService,
    recordingService,
    teamService,
    userService,
  }
}
