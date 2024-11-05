import { createAtom } from '@repro/atom'
import { SourceEventView } from '@repro/domain'
import { unpackListInto } from '@repro/std'
import { List } from '@repro/tdl'
import { ReadyState, Source } from './types'

export function createFixtureSource(fileName: string): Source {
  const request: Promise<ArrayBuffer> = fetch(fileName).then(res =>
    res.arrayBuffer()
  )

  const [$events, setEvents] = createAtom(new List(SourceEventView, []))
  const [$readyState, setReadyState] = createAtom<ReadyState>('waiting')
  const [$resourceMap] = createAtom<Record<string, string>>({})

  request
    .then(buffer => {
      const list = new List(SourceEventView, [])

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
