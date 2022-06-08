import { Source } from './types'
import { createAtom } from '@/utils/state'
import { SourceEvent } from '@/types/recording'
import { ReadyState } from '.'
import { LazyList } from '@/utils/lang'

export function createNullSource(): Source {
  const [$events] = createAtom(LazyList.Empty<SourceEvent>())
  const [$readyState] = createAtom<ReadyState>('waiting')

  return {
    $events,
    $readyState,
  }
}
