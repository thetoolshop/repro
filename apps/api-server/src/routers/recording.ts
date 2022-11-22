import { parseSchema } from '@repro/validation'
import express from 'express'
import { chain, map } from 'fluture'
import fs from 'fs'
import path from 'path'
import z from 'zod'
import { ProjectService } from '~/services/project'
import { RecordingService } from '~/services/recording'
import { badRequest } from '~/utils/errors'
import { respondWith } from '~/utils/response'

interface Config {
  recordingDataDirectory: string
}

export function createRecordingRouter(
  projectService: ProjectService,
  recordingService: RecordingService,
  config: Config
) {
  const RecordingRouter = express.Router()

  RecordingRouter.get('/', (req, res) => {
    const userId = req.user.id
    respondWith(res, recordingService.getAllRecordingsForUser(userId))
  })

  RecordingRouter.put('/:recordingId/data', (req, res) => {
    req.pipe(
      fs.createWriteStream(
        path.join(config.recordingDataDirectory, req.params.recordingId)
      )
    )

    req.on('end', () => {
      res.status(204).end()
    })
  })

  const createRecordingRequestBodySchema = z.object({
    projectId: z.string(),
    title: z.string(),
    description: z.string(),
    mode: z.number(),
    duration: z.number(),
  })

  RecordingRouter.put('/:recordingId/metadata', (req, res) => {
    const recordingId = req.params.recordingId
    const teamId = req.team.id
    const userId = req.user.id

    respondWith(
      res,
      parseSchema(createRecordingRequestBodySchema, req.body, badRequest).pipe(
        chain(body =>
          projectService
            .checkUserIsMember(userId, body.projectId)
            .pipe(
              chain(() =>
                recordingService.saveRecordingMetadata(
                  teamId,
                  body.projectId,
                  recordingId,
                  userId,
                  body.title,
                  body.description,
                  body.mode,
                  body.duration
                )
              )
            )
        )
      )
    )
  })

  RecordingRouter.get('/:recordingId/data', (req, res) => {
    const userId = req.user.id
    const recordingId = req.params.recordingId

    respondWith(
      res,
      projectService
        .getProjectForRecording(recordingId)
        .pipe(
          chain(project => projectService.checkUserIsAdmin(userId, project.id))
        )
        .pipe(
          map(() =>
            fs.createReadStream(
              path.join(config.recordingDataDirectory, recordingId)
            )
          )
        )
    )
  })

  RecordingRouter.get('/:recordingId/metadata', (req, res) => {
    const userId = req.user.id
    const recordingId = req.params.recordingId

    respondWith(
      res,
      projectService
        .getProjectForRecording(recordingId)
        .pipe(
          chain(project => projectService.checkUserIsMember(userId, project.id))
        )
        .pipe(chain(() => recordingService.getRecordingMetadata(recordingId)))
    )
  })

  return RecordingRouter
}
