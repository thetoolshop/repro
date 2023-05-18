import { User } from '@repro/domain'
import { FutureInstance } from 'fluture'
import { DataLoader } from './common'

export interface UserApi {
  getMyUser(): FutureInstance<Error, User>
}

export function createUserApi(dataLoader: DataLoader): UserApi {
  function getMyUser(): FutureInstance<Error, User> {
    return dataLoader('/users/me')
  }

  return {
    getMyUser,
  }
}
