import z from 'zod'
import { RecordingMode } from '@repro/domain'

export const projectSchema = z.object({
  id: z.string(),
  name: z.string(),
})

export type Project = z.infer<typeof projectSchema>

export const recordingMetadataSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  mode: z.nativeEnum(RecordingMode),
  duration: z.number(),
  createdAt: z.string(),
  projectId: z.string(),
  projectName: z.string(),
  authorId: z.string(),
  authorName: z.string(),
})

export type RecordingMetadata = z.infer<typeof recordingMetadataSchema>
