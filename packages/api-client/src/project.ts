import { Project, ProjectRole, User } from '@repro/domain'
import { FutureInstance } from 'fluture'
import { DataLoader } from './common'

export interface ProjectApi {
  getAllProjects(): FutureInstance<Error, Array<Project>>
  getAllProjectRoles(): FutureInstance<unknown, Record<string, ProjectRole>>
  getProject(projectId: string): FutureInstance<Error, Project>
  getProjectMembers(
    projectId: string
  ): FutureInstance<Error, Array<[User, ProjectRole]>>
  addUserToProject(
    projectId: string,
    userId: string,
    role: ProjectRole
  ): FutureInstance<Error, void>
  changeUserRole(
    projectId: string,
    userId: string,
    role: ProjectRole
  ): FutureInstance<Error, void>
  removeUserFromProject(
    projectId: string,
    userId: string
  ): FutureInstance<Error, void>
}

export function createProjectApi(dataLoader: DataLoader): ProjectApi {
  function getAllProjects(): FutureInstance<Error, Array<Project>> {
    return dataLoader('/projects')
  }

  function getAllProjectRoles(): FutureInstance<
    unknown,
    Record<string, ProjectRole>
  > {
    return dataLoader('/projects/roles')
  }

  function getProject(projectId: string): FutureInstance<Error, Project> {
    return dataLoader(`/projects/${projectId}`)
  }

  function getProjectMembers(
    projectId: string
  ): FutureInstance<Error, Array<[User, ProjectRole]>> {
    return dataLoader(`/projects/${projectId}/members`)
  }

  function addUserToProject(
    projectId: string,
    userId: string,
    role: ProjectRole
  ): FutureInstance<Error, void> {
    return dataLoader(`/projects/${projectId}/members`, {
      method: 'POST',
      body: JSON.stringify({
        userId,
        role,
      }),
    })
  }

  function changeUserRole(
    projectId: string,
    userId: string,
    role: ProjectRole
  ): FutureInstance<Error, void> {
    return dataLoader(`/projects/${projectId}/members/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({
        role,
      }),
    })
  }

  function removeUserFromProject(
    projectId: string,
    userId: string
  ): FutureInstance<Error, void> {
    return dataLoader(`/projects/${projectId}/members/${userId}`, {
      method: 'DELETE',
    })
  }

  return {
    getAllProjects,
    getAllProjectRoles,
    getProject,
    getProjectMembers,
    addUserToProject,
    changeUserRole,
    removeUserFromProject,
  }
}
