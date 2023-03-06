import { ApiClient } from '@repro/api-client'
import { SourceEvent, SourceEventView } from '@repro/domain'
import { both, fork } from 'fluture'
import { LazyList } from '@repro/std'
import { createAtom } from '~/utils/state'
import { ReadyState, Source } from './types'

export function createApiSource(
  recordingId: string,
  apiClient: ApiClient
): Source {
  const [$events, setEvents] = createAtom(LazyList.Empty<SourceEvent>())
  const [$readyState, setReadyState] = createAtom<ReadyState>('waiting')
  const [$resourceMap, setResourceMap] = createAtom<Record<string, string>>({})

  both(apiClient.recording.getRecordingEvents(recordingId))(
    apiClient.recording.getResourceMap(recordingId)
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
