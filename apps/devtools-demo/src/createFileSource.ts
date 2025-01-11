import { createAtom } from '@repro/atom'
import { SourceEventView } from '@repro/domain'
import { ReadyState, Source } from '@repro/playback'
import { calculateDuration } from '@repro/source-utils'
import { unpackListInto } from '@repro/std'
import { List } from '@repro/tdl'

export function createFileSource(file: File): Source {
  const [$events, setEvents] = createAtom(new List(SourceEventView, []))
  const [$duration, setDuration] = createAtom(0)
  const [$readyState, setReadyState] = createAtom<ReadyState>('waiting')
  const [$error, setError] = createAtom<Error | null>(null)

  // TODO: bundle resources
  const [$resourceMap] = createAtom<Record<string, string>>({})

  file
    .arrayBuffer()
    .then(buffer => {
      const list = new List(SourceEventView, [])

      unpackListInto(buffer, list)

      setDuration(calculateDuration(list))
      setEvents(list)
      setReadyState('ready')
    })
    .catch(error => {
      setError(error)
      setReadyState('failed')
    })

  return {
    $events,
    $duration,
    $readyState,
    $error,
    $resourceMap,
  }
}
