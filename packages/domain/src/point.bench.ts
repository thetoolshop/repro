import { approxByteLength } from '@repro/typed-binary-encoder'
import { stress } from './bench-utils'
import { Point, PointView } from './point'

const point: Point = [1000, 1000]
const encoded = PointView.encode(point)

console.table({
  Point: {
    raw: approxByteLength(point),
    binary: approxByteLength(PointView.encode(point)),
    perf_encode: stress(() => PointView.encode(point)),
    perf_validate_encode: stress(() =>
      PointView.encode(point, { validate: true })
    ),
    perf_decode: stress(() => PointView.decode(encoded)),
  },
})
