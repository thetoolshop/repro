import { RecordingView, SourceEvent, SourceEventView } from '@repro/domain'
import { LazyList } from '@/utils/lang'
import { createAtom } from '@/utils/state'
import { ReadyState, Source } from './types'

type Transformer = (data: ArrayBuffer) => Promise<ArrayBuffer>

export function createHttpSource(
  url: string,
  responseTransformer?: Transformer
): Source {
  const [$events, _getEvents, setEvents] = createAtom(
    LazyList.Empty<SourceEvent>()
  )

  const [$readyState, _getReadyState, setReadyState] =
    createAtom<ReadyState>('waiting')

  ;(async function () {
    const response = await fetch(url)

    if (response.ok) {
      let data = await response.arrayBuffer()

      if (responseTransformer) {
        data = await responseTransformer(data)
      }

      const recording = RecordingView.decode(new DataView(data))

      setEvents(
        new LazyList(
          recording.events.map(buffer => new DataView(buffer)),
          SourceEventView.decode,
          SourceEventView.encode
        )
      )

      setReadyState('ready')
    } else {
      setReadyState('failed')
    }
  })()

  return {
    $events,
    $readyState,
  }
}
