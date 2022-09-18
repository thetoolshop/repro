import { Session, SessionView } from '@repro/domain'
import { FutureInstance, map } from 'fluture'
import { QueryResultRow } from 'pg'
import { DatabaseClient } from './database'

export interface SessionProvider {
  getSession(token: string): FutureInstance<Error, Session>
  saveSession(token: string, session: Session): FutureInstance<Error, void>
  deleteSession(token: string): FutureInstance<Error, void>
  cleanExpiredSessions(): FutureInstance<Error, void>
}

interface SessionRow extends QueryResultRow {
  data: Session
}

function toSession(row: SessionRow): Session {
  return SessionView.validate(row.data)
}

export function createSessionProvider(
  dbClient: DatabaseClient
): SessionProvider {
  function getSession(token: string): FutureInstance<Error, Session> {
    return dbClient.getOne<SessionRow, Session>(
      `
      SELECT data
      FROM sessions
      WHERE token = $1 AND expires_at > current_timestamp
      `,
      [token],
      toSession
    )
  }

  function saveSession(
    token: string,
    session: Session
  ): FutureInstance<Error, void> {
    return dbClient
      .query(
        `
        INSERT INTO sessions (token, data, expires_at)
        VALUES ($1, $2, current_timestamp + interval '7 days')
        `,
        [token, JSON.stringify(session)]
      )
      .pipe(map(() => undefined))
  }

  function deleteSession(token: string): FutureInstance<Error, void> {
    return dbClient
      .query(
        `
        DELETE FROM sessions
        WHERE token = $1
        `,
        [token]
      )
      .pipe(map(() => undefined))
  }

  function cleanExpiredSessions(): FutureInstance<Error, void> {
    return dbClient
      .query(
        `
        DELETE FROM sessions
        WHERE expired_at <= current_timestamp
        `,
        []
      )
      .pipe(map(() => undefined))
  }

  return {
    getSession,
    saveSession,
    deleteSession,
    cleanExpiredSessions,
  }
}
