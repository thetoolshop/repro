import { Team, User } from '@repro/domain'
import { Request, RequestHandler } from 'express'
import {
  ap,
  cache,
  chain,
  fork,
  FutureInstance,
  mapRej,
  reject,
  resolve,
} from 'fluture'
import { AuthService } from '~/services/auth'
import { TeamService } from '~/services/team'
import { UserService } from '~/services/user'
import { badRequest, notAuthenticated } from '~/utils/errors'

export interface AuthMiddleware {
  withSession: RequestHandler
  requireSession: RequestHandler
}

export function createAuthMiddleware(
  authService: AuthService,
  teamService: TeamService,
  userService: UserService
): AuthMiddleware {
  function getAuthToken(req: Request) {
    return req.header('authorization')?.replace(/^Bearer\s/, '') ?? null
  }

  function loadSession(
    token: string | null
  ): FutureInstance<Error, [User, Team]> {
    if (token === null) {
      return reject(badRequest('Missing "Authorization" header'))
    }

    const user = cache(
      resolve(token)
        .pipe(chain(token => authService.loadSession(token)))
        .pipe(chain(session => userService.getUserById(session.userId)))
        .pipe(mapRej(() => notAuthenticated('Not authenticated')))
    )

    const team = user.pipe(chain(user => teamService.getTeamForUser(user.id)))

    return ap<Error, Team>(team)(
      ap<Error, User>(user)(resolve(user => team => [user, team]))
    )
  }

  const withSession: RequestHandler = async function (req, _res, next) {
    fork<Error>(() => {
      next()
    })<[User, Team]>(([user, team]) => {
      req.user = user
      req.team = team
      next()
    })(loadSession(getAuthToken(req)))
  }

  const requireSession: RequestHandler = async function (req, res, next) {
    fork<Error>(err => {
      res.status(401)
      res.json({ name: err.name, message: err.message })
    })<[User, Team]>(([user, team]) => {
      req.user = user
      req.team = team
      next()
    })(loadSession(getAuthToken(req)))
  }

  return {
    withSession,
    requireSession,
  }
}
