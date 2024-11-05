import { createAtom } from '@repro/atom'
import { SourceEventView } from '@repro/domain'
import { ReadyState } from '.'
import { Source } from './types'
import { List } from '@repro/tdl'

export function createNullSource(): Source {
  const [$events] = createAtom(new List(SourceEventView, []))
  const [$readyState] = createAtom<ReadyState>('waiting')
  const [$resourceMap] = createAtom<Record<string, string>>({})

  return {
    $events,
    $readyState,
    $resourceMap,
  }
}
