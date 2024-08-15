import { createAtom } from '@repro/atom'
import { SourceEvent, SourceEventView } from '@repro/domain'
import { LazyList, unpackListInto } from '@repro/std'
import { ReadyState, Source } from './types'

export function createFixtureSource(fileName: string): Source {
  const request: Promise<ArrayBuffer> = fetch(fileName).then(res =>
    res.arrayBuffer()
  )

  const [$events, setEvents] = createAtom(LazyList.Empty<SourceEvent>())
  const [$readyState, setReadyState] = createAtom<ReadyState>('waiting')
  const [$resourceMap] = createAtom<Record<string, string>>({})

  request
    .then(buffer => {
      const list = new LazyList(
        [],
        SourceEventView.decode,
        SourceEventView.encode
      )

      unpackListInto(buffer, list)
      setEvents(list)

      setReadyState('ready')
    })
    .catch(() => {
      setReadyState('failed')
    })

  return {
    $readyState,
    $events,
    $resourceMap,
  }
}
