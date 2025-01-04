import { ApiClient } from '@repro/api-client'
import { createAtom } from '@repro/atom'
import { Stats } from '@repro/diagnostics'
import { RecordingInfo, SourceEventView } from '@repro/domain'
import { decryptF } from '@repro/encryption'
import { logger } from '@repro/logger'
import { ReadyState, Source } from '@repro/playback'
import { List } from '@repro/tdl'
import { fromBinaryWireFormatStream } from '@repro/wire-formats'
import { both, chainRej, fork, map, resolve } from 'fluture'

const EMPTY_RESOURCE_MAP: Record<string, string> = {}

function getRecordingInfo(apiClient: ApiClient, recordingId: string) {
  return apiClient.fetch<RecordingInfo>(`/recordings/${recordingId}/info`)
}

function getRecordingEvents(
  apiClient: ApiClient,
  recordingId: string,
  encryptionKey?: string
) {
  return apiClient
    .fetch<ReadableStream<Uint8Array>>(
      `/recordings/${recordingId}/data`,
      undefined,
      'json',
      'stream'
    )
    .pipe(
      map(data =>
        Stats.time('createApiSource(): unpack binary wire format', () => {
          return fromBinaryWireFormatStream(data)
        })
      )
    )
    .pipe(
      map(stream =>
        stream.pipeThrough(
          new TransformStream<ArrayBuffer, ArrayBuffer>({
            transform(chunk, controller) {
              if (encryptionKey == null) {
                controller.enqueue(chunk)
                return
              }

              decryptF(chunk, encryptionKey).pipe(
                fork(error => {
                  logger.error('Decryption transform error:', error)
                  controller.error(error)
                })(value => {
                  controller.enqueue(value)
                })
              )
            },

            flush(controller) {
              controller.terminate()
            },
          }),
          {
            preventClose: true,
          }
        )
      )
    )
}

function getResourceMap(apiClient: ApiClient, recordingId: string) {
  return apiClient
    .fetch<Record<string, string>>(`/recordings/${recordingId}/resource-map`)
    .pipe(chainRej(() => resolve(EMPTY_RESOURCE_MAP)))
}

export function createApiSource(
  recordingId: string,
  apiClient: ApiClient,
  extra: { encryptionKey?: string } = {}
): Source {
  const [$events, setEvents] = createAtom(new List(SourceEventView, []))
  const [$duration, setDuration] = createAtom(0)
  const [$readyState, setReadyState] = createAtom<ReadyState>('waiting')
  const [$resourceMap, setResourceMap] = createAtom<Record<string, string>>({})

  both(getRecordingInfo(apiClient, recordingId))(
    both(getRecordingEvents(apiClient, recordingId, extra.encryptionKey))(
      getResourceMap(apiClient, recordingId)
    )
  ).pipe(
    fork(error => {
      logger.error(error)
      setReadyState('failed')
    })(([info, [events, resourceMap]]) => {
      const sourceList = new List(SourceEventView, [])
      setEvents(sourceList)

      events.pipeTo(
        new WritableStream({
          write(buffer) {
            sourceList.append(SourceEventView.over(new DataView(buffer)))
          },
        })
      )

      setDuration(info.duration)
      setResourceMap(resourceMap)
      setReadyState('ready')
    })
  )

  return {
    $events,
    $duration,
    $readyState,
    $resourceMap,
  }
}
