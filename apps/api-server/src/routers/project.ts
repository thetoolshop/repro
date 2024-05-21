import {
  Account,
  Project,
  ProjectRole,
  RecordingMode,
  StaffUser,
  User,
} from '@repro/domain'
import { FastifyPluginAsync } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import {
  FutureInstance,
  alt,
  chain,
  go,
  map,
  mapRej,
  parallel,
  reject,
} from 'fluture'
import z from 'zod'
import { defaultSystemConfig } from '~/config/system'
import { AccountService } from '~/services/account'
import { ProjectService } from '~/services/project'
import { RecordingService } from '~/services/recording'
import {
  badRequest,
  isPermissionDenied,
  notFound,
  notImplemented,
} from '~/utils/errors'
import { createResponseUtils } from '~/utils/response'

export function createProjectRouter(
  projectService: ProjectService,
  recordingService: RecordingService,
  accountService: AccountService,
  config = defaultSystemConfig
): FastifyPluginAsync {
  const { respondWith } = createResponseUtils(config)

  return async function (fastify) {
    const app = fastify.withTypeProvider<ZodTypeProvider>()

    function ensureCanAccessProject(
      user: User | StaffUser,
      projectId: string
    ): FutureInstance<Error, User> {
      return go<Error, User>(function* () {
        yield accountService.ensureUser(user)

        const account: Account = yield projectService.getAccountForProject(
          projectId
        )

        yield accountService
          .ensureCanAccessAccount(user, account.id)
          .pipe(
            mapRej(error => (isPermissionDenied(error) ? notFound() : error))
          )

        yield alt<Error, void>(
          accountService.ensureUserIsAdmin(user).pipe(map(() => undefined))
        )(projectService.ensureUserCanAccessProject(user.id, projectId))

        return user as User
      })
    }

    function ensureCanModifyProject(
      user: User | StaffUser,
      projectId: string
    ): FutureInstance<Error, User> {
      return go<Error, User>(function* () {
        yield ensureCanAccessProject(user, projectId)
        return yield alt(accountService.ensureUserIsAdmin(user))(
          projectService
            .ensureUserIsProjectAdmin(user.id, projectId)
            .pipe(map(() => user as User))
        )
      })
    }

    app.get('/', (req, res) => {
      respondWith(
        res,
        go(function* () {
          const user: User | StaffUser = yield req.getCurrentUser()
          yield accountService.ensureUser(user)
          return yield projectService.getUserProjects(user.id)
        })
      )
    })

    app.post(
      '/',

      {
        schema: {
          body: z.object({
            name: z.string(),
          }),
        },
      },

      (req, res) => {
        respondWith(
          res,
          go(function* () {
            const user: User | StaffUser = yield req.getCurrentUser()

            yield accountService.ensureUser(user)

            const account: Account = yield accountService.getAccountForUser(
              user.id
            )

            const project: Project = yield projectService.createProject(
              account.id,
              req.body.name
            )

            yield projectService.updateUserProjectRole(
              user.id,
              project.id,
              ProjectRole.Admin
            )

            return project
          }),
          201
        )
      }
    )

    app.get(
      '/:projectId',

      {
        schema: {
          params: z.object({
            projectId: z.string(),
          }),
        },
      },

      (req, res) => {
        const { projectId } = req.params
        respondWith(
          res,
          go(function* () {
            const user: User | StaffUser = yield req.getCurrentUser()
            yield ensureCanAccessProject(user, projectId)
            return yield projectService.getProjectById(projectId)
          })
        )
      }
    )

    app.put(
      '/:projectId/active',

      {
        schema: {
          body: z.object({
            active: z.boolean(),
          }),
          params: z.object({
            projectId: z.string(),
          }),
        },
      },

      (req, res) => {
        const active = req.body.active
        const projectId = req.params.projectId

        respondWith(
          res,
          req
            .getCurrentUser()
            .pipe(chain(user => ensureCanModifyProject(user, projectId)))
            .pipe(
              chain(() =>
                active
                  ? reject(notImplemented())
                  : projectService.deactivateProject(projectId)
              )
            )
        )
      }
    )

    app.put(
      '/:projectId/name',

      {
        schema: {
          params: z.object({
            projectId: z.string(),
          }),

          body: z.object({
            name: z.string(),
          }),
        },
      },

      (req, res) => {
        const name = req.body.name
        const projectId = req.params.projectId

        respondWith(
          res,
          req
            .getCurrentUser()
            .pipe(chain(user => ensureCanModifyProject(user, projectId)))
            .pipe(
              chain(() => projectService.updateProjectName(projectId, name))
            )
        )
      }
    )

    app.get(
      '/:projectId/members',

      {
        schema: {
          params: z.object({
            projectId: z.string(),
          }),
        },
      },

      (req, res) => {
        const projectId = req.params.projectId

        respondWith(
          res,
          go(function* () {
            const user: User | StaffUser = yield req.getCurrentUser()
            yield ensureCanAccessProject(user, projectId)

            const members: Array<{ userId: string; role: ProjectRole }> =
              yield projectService.getProjectMembers(projectId)

            return yield parallel(Infinity)(
              members.map(member =>
                accountService
                  .getUserById(member.userId)
                  .pipe(map(user => ({ user, role: member.role })))
              )
            )
          })
        )
      }
    )

    app.post(
      '/:projectId/members',
      {
        schema: {
          params: z.object({
            projectId: z.string(),
          }),

          body: z.object({
            userId: z.string(),
            role: z.nativeEnum(ProjectRole),
          }),
        },
      },

      (req, res) => {
        const projectId = req.params.projectId
        const { userId, role } = req.body
        respondWith(
          res,
          go(function* () {
            const user: User | StaffUser = yield req.getCurrentUser()

            yield ensureCanModifyProject(user, projectId)

            yield accountService
              .ensureCanAccessUser(user, userId)
              .pipe(
                mapRej(error =>
                  isPermissionDenied(error)
                    ? badRequest(`Unknown user ID "${userId}"`)
                    : error
                )
              )

            yield projectService.updateUserProjectRole(userId, projectId, role)

            const subjectUser: User = yield accountService.getUserById(userId)

            return {
              user: subjectUser,
              role,
            }
          })
        )
      }
    )

    app.get(
      '/:projectId/members/:userId',

      {
        schema: {
          params: z.object({
            projectId: z.string(),
            userId: z.string(),
          }),
        },
      },

      (req, res) => {
        const { projectId, userId } = req.params
        respondWith(
          res,
          go(function* () {
            const user: User | StaffUser = yield req.getCurrentUser()
            yield ensureCanAccessProject(user, projectId)

            const role: ProjectRole = yield projectService.getUserProjectRole(
              userId,
              projectId
            )
            const subject: User = yield accountService.getUserById(userId)

            return {
              user: subject,
              role,
            }
          })
        )
      }
    )

    app.delete(
      '/:projectId/members/:userId',

      {
        schema: {
          params: z.object({
            projectId: z.string(),
            userId: z.string(),
          }),
        },
      },

      (req, res) => {
        const { projectId, userId } = req.params
        respondWith(
          res,
          go(function* () {
            const user: User | StaffUser = yield req.getCurrentUser()

            yield accountService
              .ensureCanAccessUser(user, userId)
              .pipe(
                mapRej(error =>
                  isPermissionDenied(error) ? notFound() : error
                )
              )

            yield ensureCanModifyProject(user, projectId)
            return yield projectService.removeUserFromProject(userId, projectId)
          })
        )
      }
    )

    app.put(
      '/:projectId/members/:userId/role',

      {
        schema: {
          params: z.object({
            projectId: z.string(),
            userId: z.string(),
          }),
          body: z.object({
            role: z.nativeEnum(ProjectRole),
          }),
        },
      },

      (req, res) => {
        const { projectId, userId } = req.params
        const role = req.body.role
        respondWith(
          res,
          go(function* () {
            const user: User | StaffUser = yield req.getCurrentUser()

            yield accountService
              .ensureCanAccessUser(user, userId)
              .pipe(
                mapRej(error =>
                  isPermissionDenied(error) ? notFound() : error
                )
              )

            yield ensureCanModifyProject(user, projectId)

            return yield projectService.updateUserProjectRole(
              userId,
              projectId,
              role
            )
          })
        )
      }
    )

    app.get(
      '/:projectId/recordings',

      {
        schema: {
          params: z.object({
            projectId: z.string(),
          }),
        },
      },

      (req, res) => {
        const { projectId } = req.params
        respondWith(
          res,
          go(function* () {
            const user: User | StaffUser = yield req.getCurrentUser()
            yield ensureCanAccessProject(user, projectId)
            return yield projectService.getRecordingsForProject(projectId)
          })
        )
      }
    )

    app.get(
      '/:projectId/recordings/:recordingId/info',

      {
        schema: {
          params: z.object({
            projectId: z.string(),
            recordingId: z.string(),
          }),
        },
      },

      (req, res) => {
        const { projectId, recordingId } = req.params

        respondWith(
          res,
          go(function* () {
            const user: User | StaffUser = yield req.getCurrentUser()
            yield ensureCanAccessProject(user, projectId)
            return yield recordingService.readInfo(recordingId)
          })
        )
      }
    )

    app.post(
      '/:projectId/recordings',

      {
        schema: {
          params: z.object({
            projectId: z.string(),
          }),

          body: z.object({
            title: z.string(),
            url: z.string().url(),
            description: z.string(),
            mode: z.nativeEnum(RecordingMode),
            duration: z.number(),
            browserName: z.string().nullable(),
            browserVersion: z.string().nullable(),
            operatingSystem: z.string().nullable(),
          }),
        },
      },

      (req, res) => {
        const { projectId } = req.params

        respondWith(
          res,
          go(function* () {
            const user: User | StaffUser = yield req.getCurrentUser()
            yield ensureCanAccessProject(user, projectId)
            return yield recordingService.writeInfo(
              req.body.title,
              req.body.url,
              req.body.description,
              req.body.mode,
              req.body.duration,
              req.body.browserName,
              req.body.browserVersion,
              req.body.operatingSystem
            )
          }),
          201
        )
      }
    )

    app.get(
      '/:projectId/recordings/:recordingId/data',

      {
        schema: {
          params: z.object({
            projectId: z.string(),
            recordingId: z.string(),
          }),
        },
      },

      (req, res) => {
        const { projectId, recordingId } = req.params

        respondWith(
          res,
          go(function* () {
            const user: User | StaffUser = yield req.getCurrentUser()
            yield ensureCanAccessProject(user, projectId)
            return yield recordingService.readDataAsStream(recordingId)
          })
        )
      }
    )

    app.put(
      '/:projectId/recordings/:recordingId/data',

      {
        schema: {
          params: z.object({
            projectId: z.string(),
            recordingId: z.string(),
          }),
        },
      },

      (req, res) => {
        const { projectId, recordingId } = req.params

        respondWith(
          res,
          go(function* () {
            const user: User | StaffUser = yield req.getCurrentUser()
            yield ensureCanAccessProject(user, projectId)
            return yield recordingService.writeDataFromStream(
              recordingId,
              req.raw
            )
          })
        )
      }
    )

    app.get(
      '/:projectId/recordings/:recordingId/resources/:resourceId',

      {
        schema: {
          params: z.object({
            projectId: z.string(),
            recordingId: z.string(),
            resourceId: z.string(),
          }),
        },
      },

      (req, res) => {
        const { projectId, recordingId, resourceId } = req.params

        respondWith(
          res,
          // TODO: check the performance cost of checking access controls
          go(function* () {
            const user: User | StaffUser = yield req.getCurrentUser()
            yield ensureCanAccessProject(user, projectId)
            return yield recordingService.readResourceAsStream(
              recordingId,
              resourceId
            )
          })
        )
      }
    )

    app.put(
      '/:projectId/recordings/:recordingId/resources/:resourceId',

      {
        schema: {
          params: z.object({
            projectId: z.string(),
            recordingId: z.string(),
            resourceId: z.string(),
          }),
        },
      },

      (req, res) => {
        const { projectId, recordingId, resourceId } = req.params

        respondWith(
          res,
          go(function* () {
            const user: User | StaffUser = yield req.getCurrentUser()
            yield ensureCanAccessProject(user, projectId)
            return yield recordingService.writeResourceFromStream(
              recordingId,
              resourceId,
              req.raw
            )
          })
        )
      }
    )

    app.get(
      '/:projectId/recordings/:recordingId/resource-map',

      {
        schema: {
          params: z.object({
            projectId: z.string(),
            recordingId: z.string(),
          }),
        },
      },

      (req, res) => {
        const { projectId, recordingId } = req.params

        respondWith(
          res,
          go<Error, Record<string, string>>(function* () {
            const user: User | StaffUser = yield req.getCurrentUser()
            yield ensureCanAccessProject(user, projectId)
            return yield recordingService.readResourceMap(recordingId)
          })
        )
      }
    )

    app.put(
      '/:projectId/recordings/:recordingId/resource-map',

      {
        schema: {
          params: z.object({
            projectId: z.string(),
            recordingId: z.string(),
          }),

          body: z.record(z.string()),
        },
      },

      (req, res) => {
        const { projectId, recordingId } = req.params

        respondWith(
          res,
          go<Error, Record<string, string>>(function* () {
            const user: User | StaffUser = yield req.getCurrentUser()
            yield ensureCanAccessProject(user, projectId)
            return yield recordingService.writeResourceMap(
              recordingId,
              req.body
            )
          })
        )
      }
    )
  }
}
