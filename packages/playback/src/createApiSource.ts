import { ApiClient } from '@repro/api-client'
import { createAtom } from '@repro/atom'
import { SourceEvent, SourceEventView } from '@repro/domain'
import { LazyList } from '@repro/std'
import { fromWireFormat } from '@repro/wire-formats'
import { both, chainRej, fork, map, resolve } from 'fluture'
import { ReadyState, Source } from './types'

const EMPTY_RESOURCE_MAP = {}

function getRecordingEvents(apiClient: ApiClient, recordingId: string) {
  return apiClient.fetch<string>(`/recordings/${recordingId}/data`).pipe(
    map(data => {
      const lines = data.split('\n')
      const events: Array<SourceEvent> = []

      for (const line of lines) {
        if (line) {
          events.push(SourceEventView.from(fromWireFormat(line)))
        }
      }

      return events
    })
  )
}

function getResourceMap(apiClient: ApiClient, recordingId: string) {
  return apiClient
    .fetch<Record<string, string>>(`/recordings/${recordingId}/resource-map`)
    .pipe(chainRej(() => resolve(EMPTY_RESOURCE_MAP)))
}

export function createApiSource(
  recordingId: string,
  apiClient: ApiClient
): Source {
  const [$events, setEvents] = createAtom(LazyList.Empty<SourceEvent>())
  const [$readyState, setReadyState] = createAtom<ReadyState>('waiting')
  const [$resourceMap, setResourceMap] = createAtom<Record<string, string>>({})

  both(getRecordingEvents(apiClient, recordingId))(
    getResourceMap(apiClient, recordingId)
  ).pipe(
    fork(() => setReadyState('failed'))(([events, resourceMap]) => {
      setEvents(
        new LazyList<SourceEvent>(
          events,
          SourceEventView.decode,
          SourceEventView.encode
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
