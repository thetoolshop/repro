import {
  StructDescriptor,
  createView,
  IntegerDescriptor,
} from '@repro/typed-binary-encoder'
import z from 'zod'

// type uuid = char[36]

// type Project: struct {
//   id: uuid
//   name: string
//   active: bool
// }
//
// type ProjectRole: enum {
//   Admin
//   Member
// }

export const ProjectSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  active: z.boolean(),
})

export type Project = z.infer<typeof ProjectSchema>

export const ProjectView = createView<Project, StructDescriptor>(
  {
    type: 'struct',
    fields: [
      ['id', { type: 'char', bytes: 36 }],
      ['name', { type: 'string' }],
      ['active', { type: 'bool' }],
    ],
  },
  ProjectSchema
)

export enum ProjectRole {
  Admin,
  Member,
}

export const ProjectRoleSchema = z.nativeEnum(ProjectRole)

export const ProjectRoleView = createView<ProjectRole, IntegerDescriptor>(
  {
    type: 'integer',
    signed: false,
    bits: 8,
  },
  ProjectRoleSchema
)
