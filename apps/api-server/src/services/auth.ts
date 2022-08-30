import { createSecretKey } from 'crypto'
import { attemptP, FutureInstance } from 'fluture'
import { SignJWT, jwtVerify, JWTPayload } from 'jose'
import { Session } from '@/types/session'

export interface AuthService {
  createSessionToken(session: Session): FutureInstance<Error, string>
  verifySessionToken(token: string): FutureInstance<Error, Session>
}

interface AuthConfig {
  sessionSecret: string
}

export function createAuthService(config: AuthConfig): AuthService {
  const secretKey = createSecretKey(config.sessionSecret, 'utf-8')

  function createSessionToken(session: Session): FutureInstance<Error, string> {
    return attemptP(() =>
      new SignJWT(session)
        .setProtectedHeader({ alg: 'ES256' })
        .setIssuedAt()
        .setAudience('https://repro.dev')
        .setIssuer('https://repro.dev')
        .setExpirationTime('7d')
        .sign(secretKey)
    )
  }

  function createSessionFromJWTPayload(payload: JWTPayload): Session {
    return {
      userId: payload.userId as string,
    }
  }

  function verifySessionToken(token: string): FutureInstance<Error, Session> {
    return attemptP(() =>
      jwtVerify(token, secretKey).then(result =>
        createSessionFromJWTPayload(result.payload)
      )
    )
  }

  return {
    createSessionToken,
    verifySessionToken,
  }
}
