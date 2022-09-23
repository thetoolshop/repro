import { User } from '@repro/domain'
import { chain, FutureInstance } from 'fluture'
import { UserProvider } from '~/providers/user'
import { EmailUtils } from '~/utils/email'

export function createUserService(
  userProvider: UserProvider,
  emailUtils: EmailUtils
) {
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

export type UserService = ReturnType<typeof createUserService>
