import { Team, TeamView } from '@repro/domain'
import { FutureInstance } from 'fluture'
import { QueryResultRow } from 'pg'
import { DatabaseClient } from './database'

interface TeamRow extends QueryResultRow {
  id: string
  name: string
}

export interface TeamProvider {
  createTeam(name: string): FutureInstance<Error, Team>
  getTeam(teamId: string): FutureInstance<Error, Team>
  getTeamForUser(userId: string): FutureInstance<Error, Team>
}

export function createTeamProvider(dbClient: DatabaseClient): TeamProvider {
  function createTeam(name: string): FutureInstance<Error, Team> {
    return dbClient.getOne<TeamRow, Team>(
      `
        INSERT INTO teams (name)
        VALUES ($1)
        RETURNING id, name
        `,
      [name],
      TeamView.validate
    )
  }

  function getTeam(teamId: string): FutureInstance<Error, Team> {
    return dbClient.getOne<TeamRow, Team>(
      `
      SELECT id, name
      FROM teams
      WHERE id = $1
      `,
      [teamId],
      TeamView.validate
    )
  }

  function getTeamForUser(userId: string): FutureInstance<Error, Team> {
    return dbClient.getOne<TeamRow, Team>(
      `
      SELECT t.id, t.name
      FROM teams t
      INNER JOIN users u ON u.team_id = t.id
      WHERE u.id = $1
      `,
      [userId],
      TeamView.validate
    )
  }

  return {
    createTeam,
    getTeam,
    getTeamForUser,
  }
}
