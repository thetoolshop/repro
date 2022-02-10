import { Recording, SourceEvent } from '@/types/recording'
import { ArrayBufferBackedList } from '@/utils/lang'
import { createAtom } from '@/utils/state'
import { BufferReader } from 'arraybuffer-utils'
import { AsyncGunzipOptions, unzlib } from 'fflate'
import { LITTLE_ENDIAN } from '../codecs/common'
import { decodeRecording } from '../codecs/recording'
import { ReadyState, Source } from './types'

function unzlibP(data: Uint8Array, opts: AsyncGunzipOptions) {
  return new Promise<ArrayBuffer>((resolve, reject) => {
    unzlib(data, opts, (err, data) => {
      if (err) {
        reject(err)
      } else {
        resolve(data.buffer)
      }
    })
  })
}

function recordingDecoder(buffer: ArrayBuffer): Recording {
  const reader = new BufferReader(buffer, 0, LITTLE_ENDIAN)
  return decodeRecording(reader)
}

export function createHttpSource(url: string): Source {
  const [$events, _getEvents, setEvents] = createAtom<
    ArrayBufferBackedList<SourceEvent>
  >(ArrayBufferBackedList.NoOp<SourceEvent>())

  const [$readyState, _getReadyState, setReadyState] =
    createAtom<ReadyState>('waiting')

  ;(async function () {
    const response = await fetch(url)

    if (response.ok) {
      const data = await response.arrayBuffer()
      const uncompressed = await unzlibP(new Uint8Array(data), {
        consume: true,
      })
      const recording = recordingDecoder(uncompressed)

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
