import { approxByteLength } from '@repro/typed-binary-encoder'
import { Point, PointView } from './point'

describe('Point codec', () => {
  it('should create a binary view from a point', () => {
    const input: Point = [1000, 1000]
    const buffer = PointView.encode(input)
    const view = PointView.from(input)

    expect(buffer.byteLength).toBeLessThan(approxByteLength(input))
    expect(view).toEqual(input)
  })
})
