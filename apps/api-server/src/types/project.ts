import z from 'zod'

export const projectSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  active: z.boolean(),
})

export type Project = z.infer<typeof projectSchema>

export type ProjectRole = 'admin' | 'member'
