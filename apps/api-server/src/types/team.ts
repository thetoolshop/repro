import z from 'zod'

export const teamSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
})

export type Team = z.infer<typeof teamSchema>
