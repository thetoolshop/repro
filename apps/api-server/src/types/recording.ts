import z from 'zod'

export const recordingMetadataSchema = z.object({
  title: z.string(),
  description: z.string(),
  duration: z.number(),
  createdAt: z.string(),
  project: z.object({
    id: z.string(),
    name: z.string(),
  }),
  author: z.object({
    id: z.string(),
    name: z.string(),
  }),
})

export type RecordingMetadata = z.infer<typeof recordingMetadataSchema>
