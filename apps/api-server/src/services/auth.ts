import { chain, map, FutureInstance } from 'fluture'
import { always } from 'ramda'
import { SessionProvider } from '~/providers/session'
import { Session } from '~/types/session'
import { CryptoUtils } from '~/utils/crypto'

export interface AuthService {
  createSessionToken(session: Session): FutureInstance<Error, string>
  loadSession(token: string): FutureInstance<Error, Session>
  deleteSession(token: string): FutureInstance<Error, void>
  cleanExpiredSessions(): FutureInstance<Error, void>
}

export function createAuthService(
  sessionProvider: SessionProvider,
  cryptoUtils: CryptoUtils
): AuthService {
  function createSessionToken(session: Session): FutureInstance<Error, string> {
    return cryptoUtils
      .createRandomString(32)
      .pipe(
        chain(token =>
          sessionProvider.saveSession(token, session).pipe(map(always(token)))
        )
      )
  }

  function loadSession(token: string): FutureInstance<Error, Session> {
    return sessionProvider.getSession(token)
  }

  function deleteSession(token: string): FutureInstance<Error, void> {
    return sessionProvider.deleteSession(token)
  }

  function cleanExpiredSessions(): FutureInstance<Error, void> {
    return sessionProvider.cleanExpiredSessions()
  }

  return {
    createSessionToken,
    loadSession,
    deleteSession,
    cleanExpiredSessions,
  }
}
