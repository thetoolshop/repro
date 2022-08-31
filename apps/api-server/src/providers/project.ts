import { FutureInstance, map, mapRej } from 'fluture'
import { QueryResultRow } from 'pg'
import { Project, ProjectRole } from '~/types/project'
import { User } from '~/types/user'
import { permissionDenied } from '~/utils/errors'
import { DatabaseClient } from './database'

interface ProjectRoleRow extends QueryResultRow {
  project_id: string
  role: ProjectRole
}

export interface ProjectProvider {
  createProject(teamId: string, name: string): FutureInstance<Error, Project>

  activateProject(projectId: string): FutureInstance<Error, Project>
  deactivateProject(projectId: string): FutureInstance<Error, Project>

  checkUserIsMember(
    userId: string,
    projectId: string
  ): FutureInstance<Error, void>
  checkUserIsAdmin(
    userId: string,
    projectId: string
  ): FutureInstance<Error, void>

  getAllProjectsForUser(userId: string): FutureInstance<Error, Array<Project>>
  getAllProjectRolesForUser(
    userId: string
  ): FutureInstance<Error, Record<string, ProjectRole>>
  getProject(projectId: string): FutureInstance<Error, Project>
  getProjectForRecording(recordingId: string): FutureInstance<Error, Project>

  getProjectMembers(
    projectId: string
  ): FutureInstance<Error, Array<[User, ProjectRole]>>
  addUserToProject(
    projectId: string,
    userId: string,
    role: 'admin' | 'member'
  ): FutureInstance<Error, void>
  changeUserRole(
    projectId: string,
    userId: string,
    role: 'admin' | 'member'
  ): FutureInstance<Error, void>
  removeUserFromProject(
    projectId: string,
    userId: string
  ): FutureInstance<Error, void>
}

export function createProjectProvider(
  dbClient: DatabaseClient
): ProjectProvider {
  function createProject(
    teamId: string,
    name: string
  ): FutureInstance<Error, Project> {
    return dbClient.getOne<Project>(
      `
      INSERT INTO projects (team_id, name)
      VALUES ($1, $2)
      RETURNING id, name, active
      `,
      [teamId, name]
    )
  }

  function activateProject(projectId: string): FutureInstance<Error, Project> {
    return dbClient.getOne<Project>(
      `
      UPDATE projects
      SET active = true
      WHERE id = $1
      RETURNING id, name, active
      `,
      [projectId]
    )
  }

  function deactivateProject(
    projectId: string
  ): FutureInstance<Error, Project> {
    return dbClient.getOne<Project>(
      `
      UPDATE projects
      SET active = false
      WHERE id = $1
      RETURNING id, name, active
      `,
      [projectId]
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
    return dbClient.getOne<Project>(
      `
      SELECT id, name, active
      FROM projects
      WHERE id = $1
      `,
      [projectId]
    )
  }

  function getProjectForRecording(
    recordingId: string
  ): FutureInstance<Error, Project> {
    return dbClient.getOne<Project>(
      `
      SELECT p.id, p.name, p.active
      FROM projects p
      INNER JOIN recordings r ON r.project_id = p.id
      WHERE r.id = $1
      `,
      [recordingId]
    )
  }

  function getAllProjectsForUser(
    userId: string
  ): FutureInstance<Error, Array<Project>> {
    return dbClient.getMany<Project>(
      `
      SELECT p.id, p.name, p.active
      FROM projects p
      INNER JOIN projects_users m ON m.project_id = p.id
      WHERE m.user_id = $1
      `,
      [userId]
    )
  }

  function getAllProjectRolesForUser(
    userId: string
  ): FutureInstance<Error, Record<string, ProjectRole>> {
    const result = dbClient.getMany<ProjectRoleRow>(
      `
      SELECT project_id, role
      FROM projects_users
      WHERE user_id = $1
      `,
      [userId]
    )

    return result.pipe(
      map(rows =>
        rows.reduce((acc, row) => {
          acc[row.project_id] = row.role
          return acc
        }, {} as Record<string, ProjectRole>)
      )
    )
  }

  function getProjectMembers(
    projectId: string
  ): FutureInstance<Error, Array<User>> {
    return dbClient.getMany<User>(
      `
      SELECT u.id, u.email, u.name, m.role
      FROM users u
      INNER JOIN projects_users m ON m.project_id = u.id
      WHERE m.project_id = $1
      `,
      [projectId]
    )
  }

  function addUserToProject(
    projectId: string,
    userId: string,
    role: 'admin' | 'member'
  ): FutureInstance<Error, void> {
    return dbClient
      .query(
        `
        INSERT INTO projects_users (project_id, user_id, role)
        VALUES ($1, $2, $3)
        `,
        [projectId, userId, role]
      )
      .pipe(map(() => undefined))
  }

  function changeUserRole(
    projectId: string,
    userId: string,
    role: 'admin' | 'member'
  ): FutureInstance<Error, void> {
    return dbClient
      .query(
        `
        UPDATE projects_users
        SET role = $3
        WHERE project_id = $1 AND user_id = $2
        `,
        [projectId, userId, role]
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
