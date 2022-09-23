import { Session } from '@repro/domain'
import { chain, map, FutureInstance } from 'fluture'
import { always } from 'ramda'
import { SessionProvider } from '~/providers/session'
import { CryptoUtils } from '~/utils/crypto'

export function createAuthService(
  sessionProvider: SessionProvider,
  cryptoUtils: CryptoUtils
) {
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

export type AuthService = ReturnType<typeof createAuthService>
