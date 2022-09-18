import { Team } from '@repro/domain'
import { FutureInstance } from 'fluture'
import { TeamProvider } from '~/providers/team'

export interface TeamService {
  createTeam(name: string): FutureInstance<Error, Team>
  getTeam(teamId: string): FutureInstance<Error, Team>
  getTeamForUser(userId: string): FutureInstance<Error, Team>
}

export function createTeamService(teamProvider: TeamProvider): TeamService {
  function createTeam(name: string): FutureInstance<Error, Team> {
    return teamProvider.createTeam(name)
  }

  function getTeam(teamId: string): FutureInstance<Error, Team> {
    return teamProvider.getTeam(teamId)
  }

  function getTeamForUser(userId: string): FutureInstance<Error, Team> {
    return teamProvider.getTeamForUser(userId)
  }

  return {
    createTeam,
    getTeam,
    getTeamForUser,
  }
}
