import { Team } from '@repro/domain'
import { FutureInstance } from 'fluture'
import { Fetch } from './common'

export interface TeamApi {
  getMyTeam(): FutureInstance<Error, Team>
}

export function createTeamApi(fetch: Fetch): TeamApi {
  function getMyTeam(): FutureInstance<Error, Team> {
    return fetch('/teams/mine')
  }

  return {
    getMyTeam,
  }
}
