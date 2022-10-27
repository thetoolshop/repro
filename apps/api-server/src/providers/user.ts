import { User, UserView } from '@repro/domain'
import { alt, bimap, chain, FutureInstance, go, map } from 'fluture'
import { QueryResultRow } from 'pg'
import { CryptoUtils } from '~/utils/crypto'
import { notFound } from '~/utils/errors'
import { DatabaseClient } from './database'

interface ResetTokenRow extends QueryResultRow {
  reset_token: string
}

interface VerificationTokenRow extends QueryResultRow {
  verification_token: string
}

interface UserRow extends QueryResultRow {
  id: string
  name: string
  email: string
}

interface UserWithPasswordRow extends UserRow {
  password: string
}

function toResetToken(values: ResetTokenRow): string {
  return values.reset_token
}

function toVerificationToken(values: VerificationTokenRow): string {
  return values.verification_token
}

export function createUserProvider(
  dbClient: DatabaseClient,
  cryptoUtils: CryptoUtils
) {
  function createUser(
    teamId: string,
    name: string,
    email: string,
    password: string
  ): FutureInstance<Error, User> {
    return cryptoUtils.createHash(password).pipe(
      chain(hash =>
        dbClient.getOne(
          `
          INSERT INTO users (team_id, name, email, password)
          VALUES ($1, $2, $3, $4)
          RETURNING id, name, email
          `,
          [teamId, name, email, hash],
          UserView.validate
        )
      )
    )
  }

  function getOrCreateResetToken(email: string): FutureInstance<Error, string> {
    const existingToken = dbClient.getOne(
      `
      SELECT reset_token
      FROM users
      WHERE email = $1 
      AND reset_token IS NOT NULL
      AND reset_token_expires_at > NOW()
      LIMIT 1
      `,
      [email],
      toResetToken
    )

    const newToken = cryptoUtils.createRandomString().pipe(
      chain(resetToken =>
        dbClient.getOne(
          `
          UPDATE users
          SET reset_token = $1 AND reset_token_expiry = (NOW() + interval '1 hour')
          WHERE email = $2
          RETURNING reset_token
          `,
          [resetToken, email],
          toResetToken
        )
      )
    )

    return alt(newToken)(existingToken)
  }

  function createVerificationToken(
    email: string
  ): FutureInstance<Error, string> {
    return cryptoUtils.createRandomString().pipe(
      chain(verificationToken =>
        dbClient.getOne(
          `
          UPDATE users
          SET verification_token = $1
          WHERE email = $2
          RETURNING verification_token
          `,
          [verificationToken, email],
          toVerificationToken
        )
      )
    )
  }

  function getUserById(userId: string): FutureInstance<Error, User> {
    return dbClient.getOne(
      'SELECT id, name, email FROM users WHERE id = $1::UUID LIMIT 1',
      [userId],
      UserView.validate
    )
  }

  function getUserByEmail(email: string): FutureInstance<Error, User> {
    return dbClient.getOne(
      'SELECT id, name, email FROM users WHERE email = $1 LIMIT 1',
      [email],
      UserView.validate
    )
  }

  function getUserByEmailAndPassword(
    email: string,
    password: string
  ): FutureInstance<Error, User> {
    const result = dbClient.getOne<UserWithPasswordRow>(
      'SELECT id, name, email, password FROM users WHERE email = $1 LIMIT 1',
      [email]
    )

    return result.pipe(
      chain(result =>
        cryptoUtils
          .compareHash(password, result.password)
          .pipe(bimap(() => notFound())(() => UserView.validate(result)))
      )
    )
  }

  function getUserByResetToken(
    resetToken: string
  ): FutureInstance<Error, User> {
    return dbClient.getOne(
      'SELECT id, name, email FROM users WHERE reset_token = $1 LIMIT 1',
      [resetToken],
      UserView.validate
    )
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

  function verifyUser(verificationToken: string): FutureInstance<Error, void> {
    return dbClient
      .query(`UPDATE users SET verified = 1 WHERE verification_token = $1`, [
        verificationToken,
      ])
      .pipe(map(() => undefined))
  }

  return {
    createUser,
    createVerificationToken,
    getOrCreateResetToken,
    getUserByEmail,
    getUserByEmailAndPassword,
    getUserById,
    getUserByResetToken,
    setPassword,
    verifyUser,
  }
}

export type UserProvider = ReturnType<typeof createUserProvider>
