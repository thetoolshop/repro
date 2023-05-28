import { fork, go } from 'fluture'
import { createTransport as createEmailTransport } from 'nodemailer'
import { ProjectRole } from '@repro/domain'
import { env } from '~/config/env'
import { createDatabaseClient } from '~/providers/database'
import { createProjectProvider } from '~/providers/project'
// import { createRecordingProvider } from '~/providers/recording'
import { createTeamProvider } from '~/providers/team'
import { createUserProvider } from '~/providers/user'
import { createProjectService } from '~/services/project'
// import { createRecordingService } from '~/services/recording'
import { createTeamService } from '~/services/team'
import { createUserService } from '~/services/user'
import { createCryptoUtils } from '~/utils/crypto'
import { createEmailUtils } from '~/utils/email'

import * as data from './data'

const dbClient = createDatabaseClient({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_DATABASE,
  ssl: env.DB_USE_SSL ? true : false,
})

const cryptoUtils = createCryptoUtils()

const emailTransport = createEmailTransport({
  host: env.EMAIL_SMTP_HOST,
  port: env.EMAIL_SMTP_PORT,
  auth: {
    user: env.EMAIL_SMTP_USER,
    pass: env.EMAIL_SMTP_PASS,
  },
})

const emailUtils = createEmailUtils(emailTransport, {
  fromEmail: env.EMAIL_FROM_ADDRESS,
  templateDirectory: env.EMAIL_TEMPLATE_DIRECTORY,
})

const projectProvider = createProjectProvider(dbClient)
// const recordingProvider = createRecordingProvider(dbClient)
const teamProvider = createTeamProvider(dbClient)
const userProvider = createUserProvider(dbClient, cryptoUtils)

const projectService = createProjectService(projectProvider)
// const recordingService = createRecordingService(recordingProvider)
const teamService = createTeamService(teamProvider)
const userService = createUserService(userProvider, emailUtils)

function seed() {
  const result = go(function* () {
    const refs: Record<keyof typeof data, Record<string, string>> = {
      teams: {},
      users: {},
      projects: {},
      members: {},
      recordings: {},
      subscription_plan_configuration: {},
    }

    function getRef(type: keyof typeof data, key: number | string) {
      const ref = refs[type][key]

      if (ref === undefined) {
        throw new Error(
          `Could not find reference for type="${type}" key="${key}"`
        )
      }

      return ref
    }

    for (const [key, props] of Object.entries(data.teams)) {
      const team = yield teamService.createTeam(props.name)
      refs.teams[key] = team.id
    }

    for (const [key, props] of Object.entries(data.users)) {
      const user = yield userService.createUser(
        getRef('teams', props.teamId),
        props.name,
        props.email,
        props.password
      )
      refs.users[key] = user.id
    }

    for (const [key, props] of Object.entries(data.projects)) {
      const project = yield projectService.createProject(
        getRef('teams', props.teamId),
        props.name
      )
      refs.projects[key] = project.id
    }

    for (const member of data.members) {
      yield projectService.addUserToProject(
        getRef('projects', member.projectId),
        getRef('users', member.userId),
        member.role === 'admin' ? ProjectRole.Admin : ProjectRole.Member
      )
    }
  })

  fork<Error>(err => {
    console.error('Could not seed data')
    console.error(err)
  })<void>(() => {
    console.log('Data seeded successfully')
  })(result)
}

seed()
