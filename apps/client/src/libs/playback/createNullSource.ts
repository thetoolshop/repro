import { Source } from './types'
import { createAtom } from '@repro/atom'
import { SourceEvent } from '@repro/domain'
import { ReadyState } from '.'
import { LazyList } from '@repro/std'

export function createNullSource(): Source {
  const [$events] = createAtom(LazyList.Empty<SourceEvent>())
  const [$readyState] = createAtom<ReadyState>('waiting')
  const [$resourceMap] = createAtom<Record<string, string>>({})

  return {
    $events,
    $readyState,
    $resourceMap,
  }
}
