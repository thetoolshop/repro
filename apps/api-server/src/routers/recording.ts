import { RecordingView } from '@repro/domain'
import express from 'express'
import { chain, reject } from 'fluture'
import multer from 'multer'
import z from 'zod'
import { ProjectService } from '~/services/project'
import { RecordingService } from '~/services/recording'
import { bufferToDataView } from '~/utils/buffer'
import { badRequest } from '~/utils/errors'
import { respondWith } from '~/utils/response'
import { parseSchema } from '~/utils/validation'

export function createRecordingRouter(
  projectService: ProjectService,
  recordingService: RecordingService
) {
  const RecordingRouter = express.Router()
  const upload = multer()

  const createRecordingRequestBodySchema = z.object({
    projectId: z.string(),
    title: z.string(),
    description: z.string(),
  })

  RecordingRouter.post('/', upload.single('recording'), (req, res) => {
    const teamId = req.team.id
    const userId = req.user.id
    const uploadedFile = req.file

    if (!uploadedFile) {
      respondWith<never>(res, reject(badRequest('Missing recording data')))
      return
    }

    respondWith(
      res,
      parseSchema(createRecordingRequestBodySchema, req.body, badRequest).pipe(
        chain(body =>
          projectService.checkUserIsMember(userId, body.projectId).pipe(
            chain(() =>
              recordingService.saveRecording(
                teamId,
                body.projectId,
                userId,
                body.title,
                body.description,
                // TODO: add duck-type validation to TBE and wrap as Future<Error, Recording>
                RecordingView.over(bufferToDataView(uploadedFile.buffer))
              )
            )
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

  RecordingRouter.get('/:recordingId/data', (req, res) => {
    const userId = req.user.id
    const recordingId = req.params.recordingId

    respondWith(
      res,
      projectService
        .getProjectForRecording(recordingId)
        .pipe(
          chain(project => projectService.checkUserIsMember(userId, project.id))
        )
        .pipe(chain(() => recordingService.getRecording(recordingId)))
    )
  })

  return RecordingRouter
}
