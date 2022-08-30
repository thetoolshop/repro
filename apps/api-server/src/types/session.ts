import z from 'zod'

export const sessionSchema = z.object({
  userId: z.string().uuid(),
})

export type Session = z.infer<typeof sessionSchema>
