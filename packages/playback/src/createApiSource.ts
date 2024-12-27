import { ApiClient } from '@repro/api-client'
import { createAtom } from '@repro/atom'
import { Stats } from '@repro/diagnostics'
import { SourceEventView } from '@repro/domain'
import { decryptF } from '@repro/encryption'
import { logger } from '@repro/logger'
import { List } from '@repro/tdl'
import { fromBinaryWireFormat } from '@repro/wire-formats'
import { both, chain, chainRej, fork, map, parallel, resolve } from 'fluture'
import { ReadyState, Source } from './types'

const EMPTY_RESOURCE_MAP = {}

function getRecordingEvents(
  apiClient: ApiClient,
  recordingId: string,
  encryptionKey?: string
) {
  return apiClient
    .fetch<DataView>(
      `/recordings/${recordingId}/data`,
      undefined,
      'json',
      'binary'
    )
    .pipe(
      map(data =>
        Stats.time('createApiSource(): unpack binary wire format', () => {
          return fromBinaryWireFormat(data)
        })
      )
    )
    .pipe(
      chain(buffers =>
        Stats.time('createApiSource(): decrypt event buffers', () => {
          return encryptionKey != null
            ? parallel(Infinity)(
                buffers.map(buffer => decryptF(buffer, encryptionKey))
              )
            : resolve(buffers)
        })
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
  const [$readyState, setReadyState] = createAtom<ReadyState>('waiting')
  const [$resourceMap, setResourceMap] = createAtom<Record<string, string>>({})

  both(getRecordingEvents(apiClient, recordingId, extra.encryptionKey))(
    getResourceMap(apiClient, recordingId)
  ).pipe(
    fork(error => {
      logger.error(error)
      setReadyState('failed')
    })(([events, resourceMap]) => {
      setEvents(
        new List(
          SourceEventView,
          events.map(buffer => new DataView(buffer))
        )
      )
      setResourceMap(resourceMap)
      setReadyState('ready')
    })
  )

  return {
    $events,
    $readyState,
    $resourceMap,
  }
}
