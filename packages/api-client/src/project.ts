import { Project, ProjectRole, User } from '@repro/domain'
import { FutureInstance } from 'fluture'
import { DataLoader } from './common'

export function createProjectApi(dataLoader: DataLoader) {
  function getAllProjects(): FutureInstance<unknown, Array<Project>> {
    return dataLoader('/projects')
  }

  function getAllProjectRoles(): FutureInstance<
    unknown,
    Record<string, ProjectRole>
  > {
    return dataLoader('/projects/roles')
  }

  function getProject(projectId: string): FutureInstance<unknown, Project> {
    return dataLoader(`/projects/${projectId}`)
  }

  function getProjectMembers(
    projectId: string
  ): FutureInstance<unknown, Array<[User, ProjectRole]>> {
    return dataLoader(`/projects/${projectId}/members`)
  }

  function addUserToProject(
    projectId: string,
    userId: string,
    role: ProjectRole
  ): FutureInstance<unknown, void> {
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
  ): FutureInstance<unknown, void> {
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
  ): FutureInstance<unknown, void> {
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

export type ProjectApi = ReturnType<typeof createProjectApi>
