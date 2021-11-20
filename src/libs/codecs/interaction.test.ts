import {
  InteractionType,
  KeyDown,
  KeyUp,
  PointerDown,
  PointerMove,
  Scroll,
  ViewportResize,
} from '@/types/interaction'
import { createSyntheticId } from '@/utils/vdom'
import { BufferReader } from 'arraybuffer-utils'
import { approxByteLength } from '../record/buffer-utils'
import { LITTLE_ENDIAN } from './common'

describe('Interaction codecs', () => {
  it('should encode and decode viewport resize', () => {
    const input: ViewportResize = {
      type: InteractionType.ViewportResize,
      from: [0, 0],
      to: [100, 100],
      duration: 250,
    }

    const buffer = encodeInteraction(input)
    const reader = new BufferReader(buffer, 0, LITTLE_ENDIAN)
    const output = decodeInteration(reader)

    expect(buffer.byteLength).toBeLessThan(approxByteLength(input))
    expect(output).toEqual(input)
  })

  it('should encode and decode scroll', () => {
    const input: Scroll = {
      type: InteractionType.Scroll,
      target: createSyntheticId(),
      from: [0, 0],
      to: [100, 100],
      duration: 250,
    }

    const buffer = encodeInteraction(input)
    const reader = new BufferReader(buffer, 0, LITTLE_ENDIAN)
    const output = decodeInteration(reader)

    expect(buffer.byteLength).toBeLessThan(approxByteLength(input))
    expect(output).toEqual(input)
  })

  it('should encode and decode pointer move', () => {
    const input: PointerMove = {
      type: InteractionType.PointerMove,
      from: [0, 0],
      to: [100, 100],
      duration: 250,
    }

    const buffer = encodeInteraction(input)
    const reader = new BufferReader(buffer, 0, LITTLE_ENDIAN)
    const output = decodeInteration(reader)

    expect(buffer.byteLength).toBeLessThan(approxByteLength(input))
    expect(output).toEqual(input)
  })

  it('should encode and decode pointer down', () => {
    const input: PointerDown = {
      type: InteractionType.PointerDown,
      targets: [createSyntheticId(), createSyntheticId()],
      at: [500, 500],
    }

    const buffer = encodeInteraction(input)
    const reader = new BufferReader(buffer, 0, LITTLE_ENDIAN)
    const output = decodeInteraction(reader)

    expect(buffer.byteLength).toBeLessThan(approxByteLength(input))
    expect(output).toEqual(input)
  })

  it('should encode and decode pointer down', () => {
    const input: PointerDown = {
      type: InteractionType.PointerDown,
      targets: [createSyntheticId(), createSyntheticId()],
      at: [500, 500],
    }

    const buffer = encodeInteraction(input)
    const reader = new BufferReader(buffer, 0, LITTLE_ENDIAN)
    const output = decodeInteraction(reader)

    expect(buffer.byteLength).toBeLessThan(approxByteLength(input))
    expect(output).toEqual(input)
  })

  it('should encode and decode key down', () => {
    const input: KeyDown = {
      type: InteractionType.KeyDown,
      key: 'Enter',
    }

    const buffer = encodeInteraction(input)
    const reader = new BufferReader(buffer, 0, LITTLE_ENDIAN)
    const output = decodeInteraction(reader)

    expect(buffer.byteLength).toBeLessThan(approxByteLength(input))
    expect(output).toEqual(input)
  })

  it('should encode and decode key up', () => {
    const input: KeyUp = {
      type: InteractionType.KeyUp,
      key: 'Enter',
    }

    const buffer = encodeInteraction(input)
    const reader = new BufferReader(buffer, 0, LITTLE_ENDIAN)
    const output = decodeInteraction(reader)

    expect(buffer.byteLength).toBeLessThan(approxByteLength(input))
    expect(output).toEqual(input)
  })
})
