import { ApiClient } from '@repro/api-client'
import { SourceEvent, SourceEventView } from '@repro/domain'
import { fork } from 'fluture'
import { LazyList } from '~/utils/lang'
import { createAtom } from '~/utils/state'
import { ReadyState, Source } from './types'

export function createApiSource(
  recordingId: string,
  apiClient: ApiClient
): Source {
  const [$events, _getEvents, setEvents] = createAtom(
    LazyList.Empty<SourceEvent>()
  )

  const [$readyState, _getReadyState, setReadyState] =
    createAtom<ReadyState>('waiting')

  apiClient.recording.getRecordingData(recordingId).pipe(
    fork(() => setReadyState('failed'))(recording => {
      setEvents(
        new LazyList<SourceEvent>(
          recording.events.map(buffer => new DataView(buffer)),
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
