import { SourceEventView } from '@repro/domain'
import { parseSchema } from '@repro/validation'
import express from 'express'
import { alt, chain, map as fMap, reject } from 'fluture'
import { map as rxMap } from 'rxjs'
import { pipeline, Transform } from 'stream'
import { createGunzip } from 'zlib'
import z from 'zod'
import { AuthMiddleware } from '~/middleware/auth'
import { ProjectService } from '~/services/project'
import { RecordingService } from '~/services/recording'
import { badRequest, notAuthenticated } from '~/utils/errors'
import { respondWith } from '~/utils/response'

export function createRecordingRouter(
  projectService: ProjectService,
  recordingService: RecordingService,
  authMiddleware: AuthMiddleware
) {
  const RecordingRouter = express.Router()

  RecordingRouter.get('/', authMiddleware.requireSession, (req, res) => {
    const userId = req.user.id
    respondWith(res, recordingService.getAllRecordingsForUser(userId))
  })

  RecordingRouter.put(
    '/:recordingId/events',
    authMiddleware.requireSession,
    (req, res) => {
      const recordingId = req.params.recordingId!

      let tail = ''

      const split = new Transform({
        transform(chunk, _, callback) {
          tail += chunk

          const lines = tail.split(/\n/)
          tail = lines.pop() || ''

          for (const line of lines) {
            this.push(line)
          }

          callback()
        },

        final(callback) {
          this.push(tail)
          callback()
        },
      })

      const eventStream = pipeline(req, createGunzip(), split, err => {
        if (err) {
          req.destroy()
        }
      })

      respondWith(
        res,
        recordingService.saveRecordingEvents(recordingId, eventStream)
      )
    }
  )

  const createRecordingRequestBodySchema = z.object({
    projectId: z.string(),
    title: z.string(),
    url: z.string().url(),
    description: z.string(),
    mode: z.number(),
    duration: z.number(),
    browserName: z.string().nullable(),
    browserVersion: z.string().nullable(),
    operatingSystem: z.string().nullable(),
    public: z.boolean(),
  })

  RecordingRouter.put(
    '/:recordingId/metadata',
    authMiddleware.requireSession,
    (req, res) => {
      const recordingId = req.params.recordingId!
      const teamId = req.team.id
      const userId = req.user.id

      respondWith(
        res,
        parseSchema(
          createRecordingRequestBodySchema,
          req.body,
          badRequest
        ).pipe(
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
                    body.url,
                    body.description,
                    body.mode,
                    body.duration,
                    body.browserName,
                    body.browserVersion,
                    body.operatingSystem,
                    body.public
                  )
                )
              )
          )
        )
      )
    }
  )

  function ensureUserHasAccess(userId: string | null, recordingId: string) {
    return alt(
      userId === null
        ? reject(notAuthenticated('Not authenticated'))
        : projectService
            .getProjectForRecording(recordingId)
            .pipe(
              chain(project =>
                projectService.checkUserIsMember(userId, project.id)
              )
            )
    )(recordingService.checkRecordingIsPublic(recordingId))
  }

  RecordingRouter.get(
    '/:recordingId/events',
    authMiddleware.withSession,
    (req, res) => {
      const userId = req.user?.id ?? null
      const recordingId = req.params.recordingId!

      respondWith(
        res,
        ensureUserHasAccess(userId, recordingId)
          .pipe(chain(() => recordingService.getRecordingEvents(recordingId)))
          .pipe(
            fMap(sourceEvent$ =>
              sourceEvent$.pipe(
                rxMap(event => `${SourceEventView.serialize(event)}\n`)
              )
            )
          )
      )
    }
  )

  RecordingRouter.get(
    '/:recordingId/metadata',
    authMiddleware.withSession,
    (req, res) => {
      const userId = req.user?.id ?? null
      const recordingId = req.params.recordingId!

      respondWith(
        res,
        ensureUserHasAccess(userId, recordingId).pipe(
          chain(() => recordingService.getRecordingMetadata(recordingId))
        )
      )
    }
  )

  return RecordingRouter
}
