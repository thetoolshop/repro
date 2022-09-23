import express from 'express'
import z from 'zod'
import { AuthService } from '~/services/auth'
import { UserService } from '~/services/user'
import { respondWith } from '~/utils/response'
import { chain, mapRej, resolve } from 'fluture'
import { badRequest, notAuthenticated } from '~/utils/errors'
import { parseSchema } from '~/utils/validation'

export function createAuthRouter(
  authService: AuthService,
  userService: UserService
) {
  const AuthRouter = express.Router()

  const loginBodySchema = z.object({
    email: z.string().email(),
    password: z.string(),
  })

  AuthRouter.post('/login', (req, res) => {
    respondWith<string>(
      res,
      parseSchema(loginBodySchema, req.body, badRequest).pipe(
        chain(({ email, password }) =>
          userService
            .getUserByEmailAndPassword(email, password)
            .pipe(mapRej(() => notAuthenticated()))
            .pipe(
              chain(user => authService.createSessionToken({ userId: user.id }))
            )
        )
      )
    )
  })

  AuthRouter.post('/logout', (req, res) => {
    const authHeader = req.header('authorization')
    const token = resolve(authHeader?.replace(/^Bearer\s/, '') ?? '')

    respondWith<void>(
      res,
      token.pipe(chain(token => authService.deleteSession(token)))
    )
  })

  const forgotBodySchema = z.object({
    email: z.string().email(),
  })

  AuthRouter.post('/forgot', (req, res) => {
    respondWith<void>(
      res,
      parseSchema(forgotBodySchema, req.body, badRequest).pipe(
        chain(({ email }) => userService.sendPasswordResetEmail(email))
      )
    )
  })

  const resetBodySchema = z.object({
    password: z.string(),
    resetToken: z.string(),
  })

  AuthRouter.post('/reset', (req, res) => {
    respondWith<void>(
      res,
      parseSchema(resetBodySchema, req.body, badRequest).pipe(
        chain(({ password, resetToken }) =>
          userService.resetPassword(resetToken, password)
        )
      )
    )
  })

  return AuthRouter
}
