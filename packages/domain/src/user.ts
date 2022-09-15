import { StructDescriptor, createView } from '@repro/typed-binary-encoder'
import z from 'zod'

// type User: struct {
//   id: uuid
//   email: string
//   name: string
// }

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
})

export type User = z.infer<typeof UserSchema>

export const UserView = createView<User, StructDescriptor>(
  {
    type: 'struct',
    fields: [
      ['id', { type: 'char', bytes: 36 }],
      ['email', { type: 'string' }],
      ['name', { type: 'string' }],
    ],
  },
  UserSchema
)
