import { createAtom } from '@repro/atom'
import { SourceEvent } from '@repro/domain'
import { LazyList } from '@repro/std'
import { ReadyState } from '.'
import { Source } from './types'

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
