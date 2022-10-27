import { parseSchema } from '@repro/validation'
import express from 'express'
import { and, chain, map, mapRej, reject, resolve, swap } from 'fluture'
import z from 'zod'
import { AuthService } from '~/services/auth'
import { ProjectService } from '~/services/project'
import { TeamService } from '~/services/team'
import { UserService } from '~/services/user'
import { badRequest, isNotFound, notAuthenticated } from '~/utils/errors'
import { respondWith } from '~/utils/response'

export function createAuthRouter(
  authService: AuthService,
  teamService: TeamService,
  projectService: ProjectService,
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

  const registerBodySchema = z.object({
    name: z.string(),
    email: z.string().email(),
    password: z.string(),
  })

  AuthRouter.post('/register', (req, res) => {
    respondWith<void>(
      res,
      parseSchema(registerBodySchema, req.body, badRequest).pipe(
        chain(({ name, email, password }) => {
          const existingUser = userService.getUserByEmail(email)

          const newTeam = teamService.createTeam(`${name}'s Team`)

          const newProject = newTeam.pipe(
            chain(team =>
              projectService.createProject(team.id, 'Default Project')
            )
          )

          const newUser = newTeam.pipe(
            chain(team =>
              userService.createUser(team.id, name, email, password)
            )
          )

          return existingUser
            .pipe(swap)
            .pipe(mapRej(() => badRequest('User already exists')))
            .pipe(
              chain(err =>
                isNotFound(err)
                  ? newTeam
                      .pipe(and(newProject))
                      .pipe(and(newUser))
                      .pipe(
                        chain(() => userService.sendVerificationEmail(email))
                      )
                  : reject(err)
              )
            )
        })
      )
    )
  })

  return AuthRouter
}
