import { FutureInstance } from 'fluture'
import { ProjectProvider } from '~/providers/project'
import { Project, ProjectRole } from '~/types/project'
import { User } from '~/types/user'

export interface ProjectService {
  createProject(teamId: string, name: string): FutureInstance<Error, Project>

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

export function createProjectService(
  projectProvider: ProjectProvider
): ProjectService {
  function createProject(
    teamId: string,
    name: string
  ): FutureInstance<Error, Project> {
    return projectProvider.createProject(teamId, name)
  }

  function checkUserIsMember(
    userId: string,
    projectId: string
  ): FutureInstance<Error, void> {
    return projectProvider.checkUserIsMember(userId, projectId)
  }

  function checkUserIsAdmin(
    userId: string,
    projectId: string
  ): FutureInstance<Error, void> {
    return projectProvider.checkUserIsAdmin(userId, projectId)
  }

  function getAllProjectsForUser(
    userId: string
  ): FutureInstance<Error, Array<Project>> {
    return projectProvider.getAllProjectsForUser(userId)
  }

  function getAllProjectRolesForUser(
    userId: string
  ): FutureInstance<Error, Record<string, ProjectRole>> {
    return projectProvider.getAllProjectRolesForUser(userId)
  }

  function getProject(projectId: string): FutureInstance<Error, Project> {
    return projectProvider.getProject(projectId)
  }

  function getProjectForRecording(
    recordingId: string
  ): FutureInstance<Error, Project> {
    return projectProvider.getProjectForRecording(recordingId)
  }

  function getProjectMembers(
    projectId: string
  ): FutureInstance<Error, Array<[User, ProjectRole]>> {
    return projectProvider.getProjectMembers(projectId)
  }

  function addUserToProject(
    projectId: string,
    userId: string,
    role: ProjectRole
  ): FutureInstance<Error, void> {
    return projectProvider.addUserToProject(projectId, userId, role)
  }

  function changeUserRole(
    projectId: string,
    userId: string,
    role: ProjectRole
  ): FutureInstance<Error, void> {
    return projectProvider.changeUserRole(projectId, userId, role)
  }

  function removeUserFromProject(
    projectId: string,
    userId: string
  ): FutureInstance<Error, void> {
    return projectProvider.removeUserFromProject(projectId, userId)
  }

  return {
    createProject,
    checkUserIsMember,
    checkUserIsAdmin,
    getAllProjectsForUser,
    getAllProjectRolesForUser,
    getProject,
    getProjectForRecording,
    getProjectMembers,
    addUserToProject,
    changeUserRole,
    removeUserFromProject,
  }
}
