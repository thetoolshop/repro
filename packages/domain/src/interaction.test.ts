import { approxByteLength } from '@repro/typed-binary-encoder'
import {
  InteractionType,
  InteractionView,
  KeyDown,
  KeyDownView,
  KeyUp,
  KeyUpView,
  PointerDown,
  PointerDownView,
  PointerMove,
  PointerMoveView,
  PointerUp,
  PointerUpView,
  Scroll,
  ScrollView,
  ViewportResize,
  ViewportResizeView,
} from './interaction'
import { createNodeId } from './vdom'

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
      target: createNodeId(),
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
      targets: [createNodeId(), createNodeId()],
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
      targets: [createNodeId(), createNodeId()],
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
