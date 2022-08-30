import { RequestHandler } from 'express'
import { attempt, chain, fork, mapRej } from 'fluture'
import { AuthService } from '@/services/auth'
import { UserService } from '@/services/user'
import { User } from '@/types/user'
import { badRequest, notAuthenticated } from '@/utils/errors'

export interface AuthMiddleware {
  requireAuth: RequestHandler
}

export function createAuthMiddleware(
  authService: AuthService,
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

    const user = token
      .pipe(chain(token => authService.verifySessionToken(token)))
      .pipe(chain(session => userService.getUserById(session.userId)))
      .pipe(mapRej(() => notAuthenticated()))

    fork<Error>(err => {
      res.status(401)
      res.json({ success: false, error: err.message })
    })<User>(user => {
      req.user = user
      next()
    })(user)
  }

  return {
    requireAuth,
  }
}
