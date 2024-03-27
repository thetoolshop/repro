import { User } from '@repro/domain'
import { FutureInstance } from 'fluture'
import { Fetch } from './common'

export interface UserApi {
  getMyUser(): FutureInstance<Error, User>
}

export function createUserApi(fetch: Fetch): UserApi {
  function getMyUser(): FutureInstance<Error, User> {
    return fetch('/users/me')
  }

  return {
    getMyUser,
  }
}
