import { input, password } from '@inquirer/prompts'
import { fork } from 'fluture'
import path from 'node:path'

import { defaultEnv as env } from '~/config/env'
import { createSQLiteDatabaseClient } from '~/modules/database'
import { createAccountService } from '~/services/account'

const projectRoot = path.resolve(__dirname, '../..')

const database = createSQLiteDatabaseClient({
  path: path.join(projectRoot, env.DB_FILE),
})

const accountService = createAccountService(database)

async function main() {
  const name = await input({ message: 'Name', required: true })

  const email = await input({ message: 'Email', required: true })

  const pw = await password({ message: 'Password', mask: true })

  await password({
    message: 'Confirm password',
    mask: true,
    validate: value => value === pw,
  })

  return accountService
    .createStaffUser(name, email, pw)
    .pipe(
      fork(error => console.error('Unable to create staff user', error))(user =>
        console.log('Staff user created:', user.id)
      )
    )
}

main()
