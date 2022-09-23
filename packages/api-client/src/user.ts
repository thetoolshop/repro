import { User } from '@repro/domain'
import { FutureInstance } from 'fluture'
import { DataLoader } from './common'

export function createUserApi(dataLoader: DataLoader) {
  function getMyUser(): FutureInstance<unknown, User> {
    return dataLoader('/users/me')
  }

  return {
    getMyUser,
  }
}
