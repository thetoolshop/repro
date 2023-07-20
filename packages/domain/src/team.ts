import { createView, StructDescriptor } from '@repro/typed-binary-encoder'
import z from 'zod'

// type Team: struct {
//   id: uuid
//   name: string
// }

export const uuidSchema = z.string().uuid()

export const TeamSchema = z.object({
  id: uuidSchema,
  name: z.string(),
})

export type Team = z.infer<typeof TeamSchema>

// export interface Team {
//   id: string
//   name: string
// }

export const TeamView = createView<Team, StructDescriptor>(
  {
    type: 'struct',
    fields: [
      ['id', { type: 'char', bytes: 36 }],
      ['name', { type: 'string' }],
    ],
  },
  TeamSchema
)
