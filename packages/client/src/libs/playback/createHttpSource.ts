import { decrypt } from '@/libs/crypto'
import { Recording, SourceEvent } from '@/types/recording'
import { ArrayBufferBackedList } from '@/utils/lang'
import { createAtom } from '@/utils/state'
import { BufferReader } from 'arraybuffer-utils'
import { LITTLE_ENDIAN } from '../codecs/common'
import { decodeRecording } from '../codecs/recording'
import { ReadyState, Source } from './types'

type Transformer = (data: ArrayBuffer) => Promise<ArrayBuffer>

function recordingDecoder(buffer: ArrayBuffer): Recording {
  const reader = new BufferReader(buffer, 0, LITTLE_ENDIAN)
  return decodeRecording(reader)
}

export function createHttpSource(
  url: string,
  responseTransformer?: Transformer
): Source {
  const [$events, _getEvents, setEvents] = createAtom<
    ArrayBufferBackedList<SourceEvent>
  >(ArrayBufferBackedList.NoOp<SourceEvent>())

  const [$readyState, _getReadyState, setReadyState] =
    createAtom<ReadyState>('waiting')

  ;(async function () {
    const response = await fetch(url)

    if (response.ok) {
      let data = await response.arrayBuffer()

      if (responseTransformer) {
        data = await responseTransformer(data)
      }

      const recording = recordingDecoder(data)

      setEvents(recording.events)
      setReadyState('ready')
    } else {
      setReadyState('failed')
    }
  })()

  return {
    $events,
    $readyState,
  }
}
