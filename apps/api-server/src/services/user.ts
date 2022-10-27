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

  function getUserByEmail(email: string): FutureInstance<Error, User> {
    return userProvider.getUserByEmail(email)
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
    return userProvider
      .getOrCreateResetToken(email)
      .pipe(
        chain(token => emailUtils.sendEmail('password-reset', email, { token }))
      )
  }

  function sendVerificationEmail(email: string): FutureInstance<Error, void> {
    return userProvider
      .createVerificationToken(email)
      .pipe(
        chain(token =>
          emailUtils.sendEmail('user-verification', email, { token })
        )
      )
  }

  function verifyUser(verificationToken: string): FutureInstance<Error, void> {
    return userProvider.verifyUser(verificationToken)
  }

  return {
    createUser,
    getUserById,
    getUserByEmail,
    getUserByEmailAndPassword,
    resetPassword,
    sendPasswordResetEmail,
    sendVerificationEmail,
    verifyUser,
  }
}

export type UserService = ReturnType<typeof createUserService>
