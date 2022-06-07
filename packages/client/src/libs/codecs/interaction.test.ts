import {
  InteractionType,
  KeyDown,
  KeyUp,
  PointerDown,
  PointerMove,
  PointerUp,
  Scroll,
  ViewportResize,
} from '@/types/interaction'
import { createSyntheticId } from '@/utils/vdom'
import { approxByteLength } from '../record/buffer-utils'
import {
  InteractionView,
  KeyDownView,
  KeyUpView,
  PointerDownView,
  PointerMoveView,
  PointerUpView,
  ScrollView,
  ViewportResizeView,
} from './interaction'

describe('Interaction codecs', () => {
  it('should create a binary view from a viewport resize', () => {
    const input: ViewportResize = {
      type: InteractionType.ViewportResize,
      from: [0, 0],
      to: [100, 100],
      duration: 250,
    }

    const buffer = ViewportResizeView.encode(input)
    const view = ViewportResizeView.from(input)
    const envelope = InteractionView.from(input)

    expect(buffer.byteLength).toBeLessThan(approxByteLength(input))
    expect(view).toEqual(input)
    expect(envelope).toEqual(input)
  })

  it('should create a binary view from a scroll', () => {
    const input: Scroll = {
      type: InteractionType.Scroll,
      target: createSyntheticId(),
      from: [0, 0],
      to: [100, 100],
      duration: 250,
    }

    const buffer = ScrollView.encode(input)
    const view = ScrollView.from(input)
    const envelope = InteractionView.from(input)

    expect(buffer.byteLength).toBeLessThan(approxByteLength(input))
    expect(view).toEqual(input)
    expect(envelope).toEqual(input)
  })

  it('should create a binary view from a pointer move', () => {
    const input: PointerMove = {
      type: InteractionType.PointerMove,
      from: [0, 0],
      to: [100, 100],
      duration: 250,
    }

    const buffer = PointerMoveView.encode(input)
    const view = PointerMoveView.from(input)
    const envelope = InteractionView.from(input)

    expect(buffer.byteLength).toBeLessThan(approxByteLength(input))
    expect(view).toEqual(input)
    expect(envelope).toEqual(input)
  })

  it('should create a binary view from a pointer down', () => {
    const input: PointerDown = {
      type: InteractionType.PointerDown,
      targets: [createSyntheticId(), createSyntheticId()],
      at: [500, 500],
    }

    const buffer = PointerDownView.encode(input)
    const view = PointerDownView.from(input)
    const envelope = InteractionView.from(input)

    expect(buffer.byteLength).toBeLessThan(approxByteLength(input))
    expect(view).toEqual(input)
    expect(envelope).toEqual(input)
  })

  it('should create a binary view from a pointer up', () => {
    const input: PointerUp = {
      type: InteractionType.PointerUp,
      targets: [createSyntheticId(), createSyntheticId()],
      at: [500, 500],
    }

    const buffer = PointerUpView.encode(input)
    const view = PointerUpView.from(input)
    const envelope = InteractionView.from(input)

    expect(buffer.byteLength).toBeLessThan(approxByteLength(input))
    expect(view).toEqual(input)
    expect(envelope).toEqual(input)
  })

  it('should create a binary view from a key down', () => {
    const input: KeyDown = {
      type: InteractionType.KeyDown,
      key: 'Enter',
    }

    const buffer = KeyDownView.encode(input)
    const view = KeyDownView.from(input)
    const envelope = InteractionView.from(input)

    expect(buffer.byteLength).toBeLessThan(approxByteLength(input))
    expect(view).toEqual(input)
    expect(envelope).toEqual(input)
  })

  it('should create a binary view from a key up', () => {
    const input: KeyUp = {
      type: InteractionType.KeyUp,
      key: 'Enter',
    }

    const buffer = KeyUpView.encode(input)
    const view = KeyUpView.from(input)
    const envelope = InteractionView.from(input)

    expect(buffer.byteLength).toBeLessThan(approxByteLength(input))
    expect(view).toEqual(input)
    expect(envelope).toEqual(input)
  })
})
