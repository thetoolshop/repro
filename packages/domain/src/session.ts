import { createView } from '@repro/typed-binary-encoder'
import z from 'zod'

// type Session: struct {
//   userId: uuid
// }

export const SessionSchema = z.object({
  userId: z.string().uuid(),
})

export type Session = z.infer<typeof SessionSchema>

export const SessionView = createView(
  {
    type: 'struct',
    fields: [['userId', { type: 'char', bytes: 36 }]],
  },
  SessionSchema
)
