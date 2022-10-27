import { Team, User } from '@repro/domain'
import { RequestHandler } from 'express'
import { ap, attempt, cache, chain, fork, mapRej, resolve } from 'fluture'
import { AuthService } from '~/services/auth'
import { TeamService } from '~/services/team'
import { UserService } from '~/services/user'
import { badRequest, notAuthenticated } from '~/utils/errors'

export interface AuthMiddleware {
  requireAuth: RequestHandler
}

export function createAuthMiddleware(
  authService: AuthService,
  teamService: TeamService,
  userService: UserService
): AuthMiddleware {
  const requireAuth: RequestHandler = async function (req, res, next) {
    const authHeader = req.header('authorization')

    const token = attempt<Error, string>(() => {
      if (!authHeader) {
        throw badRequest('Missing "Authorization" header')
      }

      return authHeader.replace(/^Bearer\s/, '')
    })

    const user = cache(
      token
        .pipe(chain(token => authService.loadSession(token)))
        .pipe(chain(session => userService.getUserById(session.userId)))
        .pipe(mapRej(() => notAuthenticated('Not authenticated')))
    )

    const team = user.pipe(chain(user => teamService.getTeamForUser(user.id)))

    fork<Error>(err => {
      res.status(401)
      res.json({ name: err.name, message: err.message })
    })<[User, Team]>(([user, team]) => {
      req.user = user
      req.team = team
      next()
    })(
      ap<Error, Team>(team)(
        ap<Error, User>(user)(resolve(user => team => [user, team]))
      )
    )
  }

  return {
    requireAuth,
  }
}
