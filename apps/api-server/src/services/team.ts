import { Team } from '@repro/domain'
import { FutureInstance } from 'fluture'
import { TeamProvider } from '~/providers/team'

export function createTeamService(teamProvider: TeamProvider) {
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

export type TeamService = ReturnType<typeof createTeamService>
