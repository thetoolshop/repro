import { createAtom } from '@repro/atom'
import { SourceEventView } from '@repro/domain'
import { logger } from '@repro/logger'
import { ReadyState, Source } from '@repro/playback'
import { unpackListInto } from '@repro/std'
import { List } from '@repro/tdl'

export function createBlobSource(blob: Blob): Source {
  const [$events, setEvents] = createAtom(new List(SourceEventView, []))
  const [$readyState, setReadyState] = createAtom<ReadyState>('waiting')

  // TODO: bundle resources
  const [$resourceMap] = createAtom<Record<string, string>>({})

  blob
    .arrayBuffer()
    .then(buffer => {
      const list = new List(SourceEventView, [])

      unpackListInto(buffer, list)

      setEvents(list)
      setReadyState('ready')
    })
    .catch(err => {
      logger.error(err)
      setReadyState('failed')
    })

  return {
    $events,
    $readyState,
    $resourceMap,
  }
}
