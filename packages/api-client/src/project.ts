import { Project, ProjectRole, User } from '@repro/domain'
import { FutureInstance } from 'fluture'
import { Fetch } from './common'

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

export function createProjectApi(fetch: Fetch): ProjectApi {
  function getAllProjects(): FutureInstance<Error, Array<Project>> {
    return fetch('/projects')
  }

  function getAllProjectRoles(): FutureInstance<
    unknown,
    Record<string, ProjectRole>
  > {
    return fetch('/projects/roles')
  }

  function getProject(projectId: string): FutureInstance<Error, Project> {
    return fetch(`/projects/${projectId}`)
  }

  function getProjectMembers(
    projectId: string
  ): FutureInstance<Error, Array<[User, ProjectRole]>> {
    return fetch(`/projects/${projectId}/members`)
  }

  function addUserToProject(
    projectId: string,
    userId: string,
    role: ProjectRole
  ): FutureInstance<Error, void> {
    return fetch(`/projects/${projectId}/members`, {
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
    return fetch(`/projects/${projectId}/members/${userId}/role`, {
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
    return fetch(`/projects/${projectId}/members/${userId}`, {
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
