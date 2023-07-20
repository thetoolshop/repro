import { approxByteLength } from '@repro/typed-binary-encoder'
import { elementNode, vtree } from './fixtures/vdom'
import { PointerState } from './interaction'
import { Snapshot, SnapshotView } from './snapshot'

describe('Snapshot codecs', () => {
  it('should create a binary view for a full snapshot', () => {
    const input: Snapshot = {
      dom: vtree,

      interaction: {
        pointer: [100, 100],
        pointerState: PointerState.Down,
        scroll: {
          [elementNode.id]: [0, 250],
        },
        viewport: [1200, 800],
        pageURL: 'https://example.com/foo/',
      },
    }

    const buffer = SnapshotView.encode(input)
    const view = SnapshotView.from(input)

    expect(buffer.byteLength).toBeLessThan(approxByteLength(input))
    expect(view).toEqual(input)
  })
})
