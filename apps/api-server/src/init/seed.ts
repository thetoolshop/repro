import dotenv from 'dotenv'

dotenv.config()

import { fork, go } from 'fluture'
import { getEnv } from '~/config/env'
import { createDatabaseClient } from '~/providers/database'
import { createProjectProvider } from '~/providers/project'
import { createRecordingProvider } from '~/providers/recording'
import { createTeamProvider } from '~/providers/team'
import { createUserProvider } from '~/providers/user'
import { createProjectService } from '~/services/project'
import { createRecordingService } from '~/services/recording'
import { createTeamService } from '~/services/team'
import { createUserService } from '~/services/user'
import { createCryptoUtils } from '~/utils/crypto'
import { createEmailUtils } from '~/utils/email'

import * as data from './data'

const env = getEnv(process.env)

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
const teamProvider = createTeamProvider(dbClient)
const userProvider = createUserProvider(dbClient, cryptoUtils)

const projectService = createProjectService(projectProvider)
const recordingService = createRecordingService(recordingProvider)
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
        member.role
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
