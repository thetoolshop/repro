import { Team } from '@repro/domain'
import { FutureInstance } from 'fluture'
import { DataLoader } from './common'

export interface TeamApi {
  getMyTeam(): FutureInstance<Error, Team>
}

export function createTeamApi(dataLoader: DataLoader): TeamApi {
  function getMyTeam(): FutureInstance<Error, Team> {
    return dataLoader('/teams/mine')
  }

  return {
    getMyTeam,
  }
}
