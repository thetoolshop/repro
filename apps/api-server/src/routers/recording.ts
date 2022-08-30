import { RecordingView } from '@repro/domain'
import express from 'express'
import multer from 'multer'
import z from 'zod'
import { RecordingService } from '@/services/recording'
import { respondWith } from '@/utils/response'
import { reject } from 'fluture'
import { badRequest, notAuthenticated } from '@/utils/errors'

const createRecordingRequestBodySchema = z.object({
  projectId: z.string(),
  title: z.string(),
  description: z.string(),
})

function bufferToDataView(buf: Buffer): DataView {
  return new DataView(buf.buffer, buf.byteOffset, buf.byteLength)
}

export function createRecordingRouter(recordingService: RecordingService) {
  const RecordingRouter = express.Router()
  const upload = multer()

  RecordingRouter.post('/', upload.single('recording'), async (req, res) => {
    const userId = req.user && req.user.id
    const body = createRecordingRequestBodySchema.safeParse(req.body)
    const uploadedFile = req.file

    if (!userId) {
      respondWith<never>(res, reject(notAuthenticated()))
      return
    }

    if (!body.success) {
      respondWith<never>(res, reject(badRequest(body.error.toString())))
      return
    }

    if (!uploadedFile) {
      respondWith<never>(res, reject(badRequest('Missing recording data')))
      return
    }

    // TODO: add duck-type validation to TBE and wrap as Future<Error, Recording> here
    const recording = RecordingView.over(bufferToDataView(uploadedFile.buffer))

    if (!recording.id) {
      respondWith<never>(res, reject(badRequest('Missing recording ID')))
      return
    }

    const result = await recordingService.saveRecording(
      recording.id,
      body.data.projectId,
      userId,
      body.data.title,
      body.data.description,
      recording
    )

    result.cata(
      err => {
        res.status(500)
        res.json({ success: false, error: err })
      },

      () => {
        res.status(204)
        res.json({ success: true, data: null })
      }
    )
  })

  RecordingRouter.get('/:recordingId/data', async (req, res) => {
    const recordingId = req.params.recordingId

    if (!recordingId) {
      res.status(400)
      res.json({ success: false, error: 'Missing recording ID' })
      return
    }

    const result = await recordingService.getRecording(recordingId)

    result.cata(
      err => {
        res.status(404)
        res.json({ success: false, error: err })
      },

      buffer => {
        res.json({ success: true, data: buffer })
      }
    )
  })

  return RecordingRouter
}
