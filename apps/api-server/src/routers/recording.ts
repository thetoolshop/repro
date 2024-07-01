import { RecordingMode } from '@repro/domain'
import { parseSchema } from '@repro/validation'
import { FastifyPluginAsync } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { chain } from 'fluture'
import z from 'zod'
import { defaultSystemConfig } from '~/config/system'
import { AccountService } from '~/services/account'
import type { RecordingService } from '~/services/recording'
import { createResponseUtils } from '~/utils/response'

export function createRecordingRouter(
  recordingService: RecordingService,
  accountService: AccountService,
  config = defaultSystemConfig
): FastifyPluginAsync {
  const { respondWith } = createResponseUtils(config)

  return async function (fastify) {
    const app = fastify.withTypeProvider<ZodTypeProvider>()

    app.get('/', (req, res) => {
      respondWith(
        res,
        accountService
          .ensureStaffUser(req.user)
          .pipe(chain(() => recordingService.listInfo()))
      )
    })

    app.get(
      '/:recordingId/data',

      {
        schema: {
          params: z.object({
            recordingId: z.string(),
          }),
        },
      },

      (req, res) => {
        const recordingId = req.params.recordingId
        res.header('Content-Encoding', 'gzip')
        respondWith(res, recordingService.readDataAsStream(recordingId))
      }
    )

    app.put(
      '/:recordingId/data',

      {
        schema: {
          params: z.object({
            recordingId: z.string(),
          }),
        },
      },

      (req, res) => {
        const recordingId = req.params.recordingId
        respondWith(
          res,
          recordingService.writeDataFromStream(recordingId, req.raw),
          201
        )
      }
    )

    app.get(
      '/:recordingId/resources/:resourceId',

      {
        schema: {
          params: z.object({
            recordingId: z.string(),
            resourceId: z.string(),
          }),
        },
      },

      (req, res) => {
        const recordingId = req.params.recordingId
        const resourceId = req.params.resourceId
        respondWith(
          res,
          recordingService.readResourceAsStream(recordingId, resourceId)
        )
      }
    )

    app.put(
      '/:recordingId/resources/:resourceId',

      {
        schema: {
          params: z.object({
            recordingId: z.string(),
            resourceId: z.string(),
          }),
        },
      },

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

    app.get(
      '/:recordingId/resource-map',

      {
        schema: {
          params: z.object({
            recordingId: z.string(),
          }),
        },
      },

      (req, res) => {
        const recordingId = req.params.recordingId
        respondWith(res, recordingService.readResourceMap(recordingId))
      }
    )

    const writeResourceMapRequestBody = z.record(z.string())

    app.put(
      '/:recordingId/resource-map',

      {
        schema: {
          params: z.object({ recordingId: z.string() }),
          body: z.record(z.string()),
        },
      },

      (req, res) => {
        const recordingId = req.params.recordingId
        respondWith(
          res,
          parseSchema(writeResourceMapRequestBody, req.body).pipe(
            chain(body => recordingService.writeResourceMap(recordingId, body))
          ),
          201
        )
      }
    )

    app.get(
      '/:recordingId/info',

      {
        schema: {
          params: z.object({
            recordingId: z.string(),
          }),
        },
      },

      (req, res) => {
        const recordingId = req.params.recordingId!
        respondWith(res, recordingService.readInfo(recordingId))
      }
    )

    app.post(
      '/',

      {
        schema: {
          body: z.object({
            title: z.string(),
            url: z.string().url(),
            description: z.string(),
            mode: z.nativeEnum(RecordingMode),
            duration: z.number(),
            browserName: z.string().nullable(),
            browserVersion: z.string().nullable(),
            operatingSystem: z.string().nullable(),
          }),
        },
      },

      (req, res) => {
        respondWith(
          res,
          recordingService.writeInfo(
            req.body.title,
            req.body.url,
            req.body.description,
            req.body.mode,
            req.body.duration,
            req.body.browserName,
            req.body.browserVersion,
            req.body.operatingSystem
          ),
          201
        )
      }
    )
  }
}
