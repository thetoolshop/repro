import { ApiClient } from '@repro/api-client'
import { SourceEvent, SourceEventView } from '@repro/domain'
import { both, chainRej, fork, resolve } from 'fluture'
import { LazyList } from '@repro/std'
import { createAtom } from '@repro/atom'
import { ReadyState, Source } from './types'

const EMPTY_RESOURCE_MAP = {}

export function createApiSource(
  recordingId: string,
  apiClient: ApiClient
): Source {
  const [$events, setEvents] = createAtom(LazyList.Empty<SourceEvent>())
  const [$readyState, setReadyState] = createAtom<ReadyState>('waiting')
  const [$resourceMap, setResourceMap] = createAtom<Record<string, string>>({})

  both(apiClient.recording.getRecordingEvents(recordingId))(
    apiClient.recording
      .getResourceMap(recordingId)
      .pipe(chainRej(() => resolve(EMPTY_RESOURCE_MAP)))
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
