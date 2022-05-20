import { BufferReader } from 'arraybuffer-utils'
import { PointerState } from '@/types/interaction'
import { Snapshot } from '@/types/recording'
import { approxByteLength } from '../record/buffer-utils'
import { LITTLE_ENDIAN } from './common'
import { elementNode, vtree } from './fixtures/vdom'
import { decodeSnapshot, encodeSnapshot } from './snapshot'

describe('Snapshot codecs', () => {
  it('should encode and decode a full snapshot', () => {
    const input: Snapshot = {
      dom: vtree,

      interaction: {
        pointer: [100, 100],
        pointerState: PointerState.Down,
        scroll: {
          [elementNode.id]: [0, 250],
        },
        viewport: [1200, 800],
      },
    }

    const buffer = encodeSnapshot(input)
    const reader = new BufferReader(buffer, 0, LITTLE_ENDIAN)
    const output = decodeSnapshot(reader)

    expect(buffer.byteLength).toBeLessThan(approxByteLength(input))
    expect(output).toEqual(input)
  })
})
