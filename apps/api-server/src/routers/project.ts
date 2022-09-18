import { ProjectRole } from '@repro/domain'
import express from 'express'
import { chain } from 'fluture'
import z from 'zod'
import { ProjectService } from '~/services/project'
import { badRequest } from '~/utils/errors'
import { respondWith } from '~/utils/response'
import { parseSchema } from '~/utils/validation'

export function createProjectRouter(projectService: ProjectService) {
  const ProjectRouter = express.Router()

  ProjectRouter.get('/', (req, res) => {
    const userId = req.user.id
    respondWith(res, projectService.getAllProjectsForUser(userId))
  })

  ProjectRouter.get('/roles', (req, res) => {
    const userId = req.user.id
    respondWith(res, projectService.getAllProjectRolesForUser(userId))
  })

  ProjectRouter.get('/:projectId', (req, res) => {
    const userId = req.user.id
    const projectId = req.params.projectId

    respondWith(
      res,
      projectService
        .checkUserIsMember(userId, projectId)
        .pipe(chain(() => projectService.getProject(projectId)))
    )
  })

  ProjectRouter.get('/:projectId/members', (req, res) => {
    const userId = req.user.id
    const projectId = req.params.projectId

    respondWith(
      res,
      projectService
        .checkUserIsMember(userId, projectId)
        .pipe(chain(() => projectService.getProjectMembers(projectId)))
    )
  })

  const addProjectMemberBodySchema = z.object({
    userId: z.string().uuid(),
    role: z.nativeEnum(ProjectRole),
  })

  ProjectRouter.post('/:projectId/members', (req, res) => {
    const userId = req.user.id
    const projectId = req.params.projectId

    respondWith(
      res,
      parseSchema(addProjectMemberBodySchema, req.body, badRequest).pipe(
        chain(body =>
          projectService
            .checkUserIsAdmin(userId, projectId)
            .pipe(
              chain(() =>
                projectService.addUserToProject(
                  projectId,
                  body.userId,
                  body.role
                )
              )
            )
        )
      )
    )
  })

  const changeProjectMemberRoleBodySchema = z.object({
    role: z.nativeEnum(ProjectRole),
  })

  ProjectRouter.put('/:projectId/members/:memberId/role', (req, res) => {
    const userId = req.user.id
    const projectId = req.params.projectId
    const memberId = req.params.memberId

    respondWith(
      res,
      parseSchema(changeProjectMemberRoleBodySchema, req.body, badRequest).pipe(
        chain(body =>
          projectService
            .checkUserIsAdmin(userId, projectId)
            .pipe(
              chain(() =>
                projectService.changeUserRole(projectId, memberId, body.role)
              )
            )
        )
      )
    )
  })

  ProjectRouter.delete('/:projectId/members/:memberId', (req, res) => {
    const userId = req.user.id
    const projectId = req.params.projectId
    const memberId = req.params.memberId

    respondWith(
      res,
      projectService
        .checkUserIsAdmin(userId, projectId)
        .pipe(
          chain(() => projectService.removeUserFromProject(projectId, memberId))
        )
    )
  })

  return ProjectRouter
}
