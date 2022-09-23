import {
  Project,
  ProjectRole,
  ProjectRoleView,
  ProjectView,
  User,
  UserView,
} from '@repro/domain'
import { FutureInstance, map, mapRej } from 'fluture'
import { QueryResultRow } from 'pg'
import { permissionDenied } from '~/utils/errors'
import { DatabaseClient } from './database'

interface ProjectRow extends QueryResultRow {
  id: string
  name: string
  active: boolean
}

interface ProjectRoleRow extends QueryResultRow {
  project_id: string
  role: 'admin' | 'member'
}

interface UserWithMembershipRow extends QueryResultRow {
  id: string
  name: string
  email: string
  role: 'admin' | 'member'
}

export function createProjectProvider(dbClient: DatabaseClient) {
  function createProject(
    teamId: string,
    name: string
  ): FutureInstance<Error, Project> {
    return dbClient.getOne<ProjectRow, Project>(
      `
      INSERT INTO projects (team_id, name)
      VALUES ($1, $2)
      RETURNING id, name, active
      `,
      [teamId, name],
      row => ProjectView.validate(row)
    )
  }

  function activateProject(projectId: string): FutureInstance<Error, Project> {
    return dbClient.getOne<ProjectRow, Project>(
      `
      UPDATE projects
      SET active = true
      WHERE id = $1
      RETURNING id, name, active
      `,
      [projectId],
      row => ProjectView.validate(row)
    )
  }

  function deactivateProject(
    projectId: string
  ): FutureInstance<Error, Project> {
    return dbClient.getOne<ProjectRow, Project>(
      `
      UPDATE projects
      SET active = false
      WHERE id = $1
      RETURNING id, name, active
      `,
      [projectId],
      row => ProjectView.validate(row)
    )
  }

  function checkUserIsMember(
    userId: string,
    projectId: string
  ): FutureInstance<Error, void> {
    return dbClient
      .getOne(
        `
        SELECT 1
        FROM projects_users
        WHERE user_id = $1 AND project_id = $2
        `,
        [userId, projectId]
      )
      .pipe(mapRej(() => permissionDenied()))
      .pipe(map(() => undefined))
  }

  function checkUserIsAdmin(
    userId: string,
    projectId: string
  ): FutureInstance<Error, void> {
    return dbClient
      .getOne(
        `
        SELECT 1
        FROM projects_users
        WHERE user_id = $1 AND project_id = $2 AND role = 'admin'
        `,
        [userId, projectId]
      )
      .pipe(mapRej(() => permissionDenied()))
      .pipe(map(() => undefined))
  }

  function getProject(projectId: string): FutureInstance<Error, Project> {
    return dbClient.getOne<ProjectRow, Project>(
      `
      SELECT id, name, active
      FROM projects
      WHERE id = $1
      `,
      [projectId],
      row => ProjectView.validate(row)
    )
  }

  function getProjectForRecording(
    recordingId: string
  ): FutureInstance<Error, Project> {
    return dbClient.getOne<ProjectRow, Project>(
      `
      SELECT p.id, p.name, p.active
      FROM projects p
      INNER JOIN recordings r ON r.project_id = p.id
      WHERE r.id = $1
      `,
      [recordingId],
      row => ProjectView.validate(row)
    )
  }

  function getAllProjectsForUser(
    userId: string
  ): FutureInstance<Error, Array<Project>> {
    return dbClient.getMany<ProjectRow, Project>(
      `
      SELECT p.id, p.name, p.active
      FROM projects p
      INNER JOIN projects_users m ON m.project_id = p.id
      WHERE m.user_id = $1
      `,
      [userId],
      row => ProjectView.validate(row)
    )
  }

  function getAllProjectRolesForUser(
    userId: string
  ): FutureInstance<Error, Record<string, ProjectRole>> {
    const result = dbClient.getMany<ProjectRoleRow, [string, ProjectRole]>(
      `
      SELECT project_id, role
      FROM projects_users
      WHERE user_id = $1
      `,
      [userId],
      row => [
        row.project_id,
        ProjectRoleView.validate(
          row.role === 'admin' ? ProjectRole.Admin : ProjectRole.Member
        ),
      ]
    )

    return result.pipe(
      map(rows =>
        rows.reduce((acc, [projectId, role]) => {
          acc[projectId] = role
          return acc
        }, {} as Record<string, ProjectRole>)
      )
    )
  }

  function getProjectMembers(
    projectId: string
  ): FutureInstance<Error, Array<[User, ProjectRole]>> {
    return dbClient.getMany<UserWithMembershipRow, [User, ProjectRole]>(
      `
      SELECT u.id, u.email, u.name, m.role
      FROM users u
      INNER JOIN projects_users m ON m.user_id = u.id
      WHERE m.project_id = $1
      `,
      [projectId],
      row => [
        UserView.validate(row),
        ProjectRoleView.validate(
          row.role === 'admin' ? ProjectRole.Admin : ProjectRole.Member
        ),
      ]
    )
  }

  function addUserToProject(
    projectId: string,
    userId: string,
    role: ProjectRole
  ): FutureInstance<Error, void> {
    return dbClient
      .query(
        `
        INSERT INTO projects_users (project_id, user_id, role)
        VALUES ($1, $2, $3)
        `,
        [projectId, userId, role === ProjectRole.Admin ? 'admin' : 'member']
      )
      .pipe(map(() => undefined))
  }

  function changeUserRole(
    projectId: string,
    userId: string,
    role: ProjectRole
  ): FutureInstance<Error, void> {
    return dbClient
      .query(
        `
        UPDATE projects_users
        SET role = $3
        WHERE project_id = $1 AND user_id = $2
        `,
        [projectId, userId, role === ProjectRole.Admin ? 'admin' : 'member']
      )
      .pipe(map(() => undefined))
  }

  function removeUserFromProject(
    projectId: string,
    userId: string
  ): FutureInstance<Error, void> {
    return dbClient
      .query(
        `
        DELETE FROM projects_users
        WHERE project_id = $1 AND user_id = $1
        `,
        [projectId, userId]
      )
      .pipe(map(() => undefined))
  }

  return {
    createProject,
    activateProject,
    deactivateProject,
    checkUserIsMember,
    checkUserIsAdmin,
    getProject,
    getProjectForRecording,
    getAllProjectsForUser,
    getAllProjectRolesForUser,
    getProjectMembers,
    addUserToProject,
    changeUserRole,
    removeUserFromProject,
  }
}

export type ProjectProvider = ReturnType<typeof createProjectProvider>
