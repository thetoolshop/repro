import { Project, ProjectRole, Team, User } from '@repro/domain'
import { parseSchema } from '@repro/validation'
import express from 'express'
import { chain, go, mapRej, reject, resolve, swap } from 'fluture'
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
    company: z.string().optional(),
    email: z.string().email(),
    password: z.string(),
  })

  AuthRouter.post('/register', (req, res) => {
    respondWith<string>(
      res,
      parseSchema(registerBodySchema, req.body, badRequest).pipe(
        chain(({ name, company, email, password }) => {
          return go(function* () {
            const checkExistingUser: Error = yield userService
              .getUserByEmail(email)
              .pipe(swap)
              .pipe(mapRej(() => badRequest('User already exists')))

            if (isNotFound(checkExistingUser)) {
              const newTeam: Team = yield teamService.createTeam(
                company || `${name}'s Team'`
              )

              const newUser: User = yield userService.createUser(
                newTeam.id,
                name,
                email,
                password
              )

              const newProject: Project = yield projectService.createProject(
                newTeam.id,
                'Default Project'
              )

              yield projectService.addUserToProject(
                newProject.id,
                newUser.id,
                ProjectRole.Admin
              )

              // yield userService.sendVerificationEmail(email)

              return yield authService.createSessionToken({
                userId: newUser.id,
              })
            } else {
              yield reject(checkExistingUser)
            }
          })
        })
      )
    )
  })

  return AuthRouter
}
