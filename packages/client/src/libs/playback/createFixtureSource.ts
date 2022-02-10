import { createAtom } from '@/utils/state'
import { SourceEvent } from '@/types/recording'
import { ReadyState, Source } from './types'
import { ArrayBufferBackedList } from '@/utils/lang'
import { BufferReader } from 'arraybuffer-utils'
import { LITTLE_ENDIAN } from '../codecs/common'
import { decodeEvent, encodeEvent } from '../codecs/event'

function eventReader(buffer: ArrayBuffer) {
  const reader = new BufferReader(buffer, 0, LITTLE_ENDIAN)
  return decodeEvent(reader)
}

function eventWriter(event: SourceEvent) {
  return encodeEvent(event)
}

export function createFixtureSource(name: string): Source {
  const request: Promise<Array<SourceEvent>> = fetch(
    `/fixtures/${name}.json`
  ).then(res => res.json())

  const [$events, _getEvents, setEvents] = createAtom<
    ArrayBufferBackedList<SourceEvent>
  >(ArrayBufferBackedList.NoOp<SourceEvent>())

  const [$readyState, _getReadyState, setReadyState] =
    createAtom<ReadyState>('waiting')

  request.then(events => {
    setEvents(
      new ArrayBufferBackedList(
        events.map(encodeEvent),
        eventReader,
        eventWriter
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
  }
}
