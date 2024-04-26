import { RecordingMode } from '@repro/domain'
import { parseSchema } from '@repro/validation'
import { FastifyPluginAsync } from 'fastify'
import { chain } from 'fluture'
import z from 'zod'
import { defaultSystemConfig } from '~/config/system'
import { Middleware } from '~/middleware'
import type { RecordingService } from '~/services/recording'
import { badRequest } from '~/utils/errors'
import { createResponseUtils } from '~/utils/response'

export function createRecordingRouter(
  recordingService: RecordingService,
  { auth }: Middleware,
  config = defaultSystemConfig
): FastifyPluginAsync {
  const { respondWith } = createResponseUtils(config)

  return async function (fastify) {
    fastify.get('/', (req, res) => {
      respondWith(
        res,
        auth.ensureStaffUser(req).pipe(chain(() => recordingService.listInfo()))
      )
    })

    fastify.get<{ Params: { recordingId: string } }>(
      '/:recordingId/data',
      (req, res) => {
        const recordingId = req.params.recordingId
        res.header('Content-Encoding', 'gzip')
        respondWith(res, recordingService.readDataAsStream(recordingId))
      }
    )

    fastify.put<{ Params: { recordingId: string } }>(
      '/:recordingId/data',
      (req, res) => {
        const recordingId = req.params.recordingId
        respondWith(
          res,
          recordingService.writeDataFromStream(recordingId, req.raw),
          201
        )
      }
    )

    fastify.get<{ Params: { recordingId: string; resourceId: string } }>(
      '/:recordingId/resources/:resourceId',
      (req, res) => {
        const recordingId = req.params.recordingId
        const resourceId = req.params.resourceId
        respondWith(
          res,
          recordingService.readResourceAsStream(recordingId, resourceId)
        )
      }
    )

    fastify.put<{ Params: { recordingId: string; resourceId: string } }>(
      '/:recordingId/resources/:resourceId',
      (req, res) => {
        const recordingId = req.params.recordingId
        const resourceId = req.params.resourceId
        respondWith(
          res,
          recordingService.writeResourceFromStream(
            recordingId,
            resourceId,
            req.raw
          ),
          201
        )
      }
    )

    fastify.get<{ Params: { recordingId: string } }>(
      '/:recordingId/resource-map',
      (req, res) => {
        const recordingId = req.params.recordingId!
        respondWith(res, recordingService.readResourceMap(recordingId))
      }
    )

    const writeResourceMapRequestBody = z.record(z.string())

    fastify.put<{
      Params: { recordingId: string }
      Body: z.infer<typeof writeResourceMapRequestBody>
    }>('/:recordingId/resource-map', (req, res) => {
      const recordingId = req.params.recordingId
      respondWith(
        res,
        parseSchema(writeResourceMapRequestBody, req.body).pipe(
          chain(body => recordingService.writeResourceMap(recordingId, body))
        ),
        201
      )
    })

    fastify.get<{ Params: { recordingId: string } }>(
      '/:recordingId/info',
      (req, res) => {
        const recordingId = req.params.recordingId!
        respondWith(res, recordingService.readInfo(recordingId))
      }
    )

    const writeRecordingInfoRequestBody = z.object({
      title: z.string(),
      url: z.string().url(),
      description: z.string(),
      mode: z.nativeEnum(RecordingMode),
      duration: z.number(),
      browserName: z.string().nullable(),
      browserVersion: z.string().nullable(),
      operatingSystem: z.string().nullable(),
    })

    fastify.post<{ Body: z.infer<typeof writeRecordingInfoRequestBody> }>(
      '/',
      (req, res) => {
        respondWith(
          res,
          parseSchema(writeRecordingInfoRequestBody, req.body, badRequest).pipe(
            chain(body =>
              recordingService.writeInfo(
                body.title,
                body.url,
                body.description,
                body.mode,
                body.duration,
                body.browserName,
                body.browserVersion,
                body.operatingSystem
              )
            )
          ),
          201
        )
      }
    )
  }
}
