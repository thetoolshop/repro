import { chain, FutureInstance } from 'fluture'
import { UserProvider } from '~/providers/user'
import { User } from '~/types/user'
import { EmailUtils } from '~/utils/email'

export interface UserService {
  createUser(
    teamId: string,
    name: string,
    email: string,
    password: string
  ): FutureInstance<Error, User>
  getUserById(userId: string): FutureInstance<Error, User>
  getUserByEmailAndPassword(
    email: string,
    password: string
  ): FutureInstance<Error, User>
  resetPassword(
    resetToken: string,
    password: string
  ): FutureInstance<Error, void>
  sendPasswordResetEmail(email: string): FutureInstance<Error, void>
}

export function createUserService(
  userProvider: UserProvider,
  emailUtils: EmailUtils
): UserService {
  function createUser(
    teamId: string,
    name: string,
    email: string,
    password: string
  ): FutureInstance<Error, User> {
    return userProvider.createUser(teamId, name, email, password)
  }

  function getUserById(userId: string): FutureInstance<Error, User> {
    return userProvider.getUserById(userId)
  }

  function getUserByEmailAndPassword(
    email: string,
    password: string
  ): FutureInstance<Error, User> {
    return userProvider.getUserByEmailAndPassword(email, password)
  }

  function resetPassword(
    resetToken: string,
    password: string
  ): FutureInstance<Error, void> {
    return userProvider
      .getUserByResetToken(resetToken)
      .pipe(chain(user => userProvider.setPassword(user.id, password)))
  }

  function sendPasswordResetEmail(email: string): FutureInstance<Error, void> {
    return userProvider.getOrCreateResetToken(email).pipe(
      chain(token =>
        emailUtils.sendEmail('password-reset', email, {
          token,
        })
      )
    )
  }

  return {
    createUser,
    getUserById,
    getUserByEmailAndPassword,
    resetPassword,
    sendPasswordResetEmail,
  }
}
