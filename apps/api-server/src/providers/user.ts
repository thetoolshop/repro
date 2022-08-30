import Future, { alt, bimap, chain, FutureInstance, go, map } from 'fluture'
import { User, userSchema } from '@/types/user'
import { CryptoUtils } from '@/utils/crypto'
import { notFound } from '@/utils/errors'
import { DatabaseClient } from './database'

export interface UserProvider {
  getOrCreateResetToken(email: string): FutureInstance<Error, string>
  getUserByEmailAndPassword(
    email: string,
    password: string
  ): FutureInstance<Error, User>
  getUserById(userId: string): FutureInstance<Error, User>
  getUserByResetToken(resetToken: string): FutureInstance<Error, User>
  setPassword(userId: string, password: string): FutureInstance<Error, void>
}

function toUser<T extends User>(values: T): User {
  return userSchema.parse(values)
}

export function createUserProvider(
  dbClient: DatabaseClient,
  cryptoUtils: CryptoUtils
): UserProvider {
  function getOrCreateResetToken(email: string): FutureInstance<Error, string> {
    const existingToken = dbClient
      .getOne<{ resetToken: string }>(
        `
        SELECT resetToken
        FROM users
        WHERE email = $1 
        AND resetToken IS NOT NULL
        AND resetTokenExpiry > NOW()
        LIMIT 1
        `,
        [email]
      )
      .pipe(map(row => row.resetToken))

    const newToken = cryptoUtils.createRandomString().pipe(
      chain(resetToken =>
        dbClient
          .getOne<{ resetToken: string }>(
            `
            UPDATE users
            SET resetToken = $1 AND resetTokenExpiry = (NOW() + interval '1 hour')
            WHERE email = $2
            RETURNING resetToken
            `,
            [resetToken, email]
          )
          .pipe(map(row => row.resetToken))
      )
    )

    return alt(newToken)(existingToken)
  }

  function getUserById(userId: string): FutureInstance<Error, User> {
    return dbClient
      .getOne<User>('SELECT id, email FROM users WHERE id = $1::UUID LIMIT 1', [
        userId,
      ])
      .pipe(map(toUser))
  }

  function getUserByEmailAndPassword(
    email: string,
    password: string
  ): FutureInstance<Error, User> {
    const result = dbClient.getOne<User & { password: string }>(
      'SELECT id, email, password FROM users WHERE email = $1 LIMIT 1',
      [email]
    )

    return result.pipe(
      chain(result =>
        cryptoUtils
          .compareHash(password, result.password)
          .pipe(bimap(() => notFound())(() => toUser(result)))
      )
    )
  }

  function getUserByResetToken(
    resetToken: string
  ): FutureInstance<Error, User> {
    return dbClient
      .getOne<User>(
        'SELECT id, email FROM users WHERE resetToken = $1 LIMIT 1',
        [resetToken]
      )
      .pipe(map(toUser))
  }

  function setPassword(
    userId: string,
    password: string
  ): FutureInstance<Error, void> {
    return go(function* () {
      const hash = yield cryptoUtils.createHash(password)

      yield dbClient.query(
        `
        UPDATE users
        SET password = $1
        WHERE id = $2
        `,
        [hash, userId]
      )
    })
  }

  return {
    getOrCreateResetToken,
    getUserByEmailAndPassword,
    getUserById,
    getUserByResetToken,
    setPassword,
  }
}
