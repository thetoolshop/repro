import { createAtom } from '@repro/atom'
import { SourceEvent, SourceEventView } from '@repro/domain'
import { LazyList } from '@repro/std'
import { ReadyState, Source } from './types'

export function createFixtureSource(name: string): Source {
  const request: Promise<Array<SourceEvent>> = fetch(
    `/fixtures/${name}.json`
  ).then(res => res.json())

  const [$events, setEvents] = createAtom(LazyList.Empty<SourceEvent>())
  const [$readyState, setReadyState] = createAtom<ReadyState>('waiting')
  const [$resourceMap] = createAtom<Record<string, string>>({})

  request.then(events => {
    setEvents(
      new LazyList(
        events.map(event => SourceEventView.encode(event)),
        SourceEventView.decode,
        SourceEventView.encode
      )
    )
    setReadyState('ready')
  })

  request.catch(() => {
    setReadyState('failed')
  })

  return {
    $readyState,
    $events,
    $resourceMap,
  }
}
