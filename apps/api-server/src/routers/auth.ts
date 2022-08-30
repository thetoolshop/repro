import express from 'express'
import { AuthService } from '@/services/auth'
import { UserService } from '@/services/user'
import { respondWith } from '@/utils/response'
import { attempt, chain, mapRej } from 'fluture'
import { badRequest, notAuthenticated } from '@/utils/errors'

export function createAuthRouter(
  authService: AuthService,
  userService: UserService
) {
  const AuthRouter = express.Router()

  AuthRouter.post('/login', async (req, res) => {
    const { email, password } = req.body

    const token = userService
      .getUserByEmailAndPassword(email, password)
      .pipe(mapRej(() => notAuthenticated()))
      .pipe(chain(user => authService.createSessionToken({ userId: user.id })))

    respondWith<string>(res, token)
  })

  AuthRouter.post('/forgot', async (req, res) => {
    const { email } = req.body
    const result = userService.sendPasswordResetEmail(email)
    respondWith<void>(res, result)
  })

  AuthRouter.post('/reset', async (req, res) => {
    const { password, resetToken } = req.body
    const result = userService.resetPassword(resetToken, password)
    respondWith<void>(res, result)
  })

  AuthRouter.get('/verify', async (req, res) => {
    const authHeader = req.header('authorization')

    const token = attempt<Error, string>(() => {
      if (!authHeader) {
        throw badRequest('Missing "Authorization" header')
      }

      return authHeader.replace(/^Bearer\s/, '')
    })

    const result = token.pipe(
      chain(token => authService.verifySessionToken(token))
    )

    respondWith(res, result)
  })

  return AuthRouter
}
