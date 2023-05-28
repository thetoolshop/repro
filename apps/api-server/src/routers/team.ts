import express from 'express'
import { resolve } from 'fluture'
import { TeamService } from '~/services/team'
import { respondWith } from '~/utils/response'

export function createTeamRouter(_teamService: TeamService): express.Router {
  const TeamRouter = express.Router()

  TeamRouter.get('/mine', (req, res) => {
    respondWith(res, resolve(req.team))
  })

  return TeamRouter
}
