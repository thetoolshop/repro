import { FutureInstance, map } from 'fluture'
import { QueryResultRow } from 'pg'
import { Team, teamSchema } from '~/types/team'
import { DatabaseClient } from './database'

interface TeamRow extends QueryResultRow {
  id: string
  name: string
}

function toTeam<T extends TeamRow>(values: T): Team {
  return teamSchema.parse(values)
}

export interface TeamProvider {
  createTeam(name: string): FutureInstance<Error, Team>
  getTeam(teamId: string): FutureInstance<Error, Team>
  getTeamForUser(userId: string): FutureInstance<Error, Team>
}

export function createTeamProvider(dbClient: DatabaseClient): TeamProvider {
  function createTeam(name: string): FutureInstance<Error, Team> {
    return dbClient
      .getOne<TeamRow>(
        `
        INSERT INTO teams (name)
        VALUES ($1)
        RETURNING id, name
        `,
        [name]
      )
      .pipe(map(toTeam))
  }

  function getTeam(teamId: string): FutureInstance<Error, Team> {
    return dbClient.getOne<TeamRow>(
      `
      SELECT id, name
      FROM teams
      WHERE id = $1
      `,
      [teamId]
    )
  }

  function getTeamForUser(userId: string): FutureInstance<Error, Team> {
    return dbClient.getOne<Team>(
      `
      SELECT t.id, t.name
      FROM teams t
      INNER JOIN users u ON u.team_id = t.id
      WHERE u.id = $1
      `,
      [userId]
    )
  }

  return {
    createTeam,
    getTeam,
    getTeamForUser,
  }
}
