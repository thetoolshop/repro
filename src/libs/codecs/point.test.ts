import { Point } from '@/types/interaction'
import { BufferReader } from 'arraybuffer-utils'
import { approxByteLength } from '../record/buffer-utils'
import { LITTLE_ENDIAN } from './common'
import { decodePoint, encodePoint } from './point'

describe('Point codec', () => {
  it('should encode and decode a point', () => {
    const input: Point = [1000, 1000]
    const buffer = encodePoint(input)
    const reader = new BufferReader(buffer, 0, LITTLE_ENDIAN)
    const output = decodePoint(reader)

    expect(buffer.byteLength).toBeLessThan(approxByteLength(input))
    expect(output).toEqual(input)
  })
})
