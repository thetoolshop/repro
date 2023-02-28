import { ApiClient } from '@repro/api-client'
import { SourceEvent, SourceEventView } from '@repro/domain'
import { fork } from 'fluture'
import { LazyList } from '@repro/std'
import { createAtom } from '~/utils/state'
import { ReadyState, Source } from './types'

export function createApiSource(
  recordingId: string,
  apiClient: ApiClient
): Source {
  const [$events, setEvents] = createAtom(LazyList.Empty<SourceEvent>())
  const [$readyState, setReadyState] = createAtom<ReadyState>('waiting')

  apiClient.recording.getRecordingEvents(recordingId).pipe(
    fork(() => setReadyState('failed'))(events => {
      setEvents(
        new LazyList<SourceEvent>(
          events,
          SourceEventView.decode,
          SourceEventView.encode
        )
      )

      setReadyState('ready')
    })
  )

  return {
    $events,
    $readyState,
  }
}
