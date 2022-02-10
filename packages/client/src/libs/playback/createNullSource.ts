import { Source } from './types'
import { createAtom } from '@/utils/state'
import { ArrayBufferBackedList } from '@/utils/lang'
import { SourceEvent } from '@/types/recording'
import { ReadyState } from '.'

export function createNullSource(): Source {
  const [$events] = createAtom(ArrayBufferBackedList.NoOp<SourceEvent>())
  const [$readyState] = createAtom<ReadyState>('waiting')

  return {
    $events,
    $readyState,
  }
}
