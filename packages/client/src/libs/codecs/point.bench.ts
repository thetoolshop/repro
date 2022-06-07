import { approxByteLength } from '@/libs/record/buffer-utils'
import { Point } from '@/types/interaction'
import { stress } from '@/utils/bench'
import { PointView } from './point'

const point: Point = [1000, 1000]
const encoded = PointView.encode(point)

console.table({
  Point: {
    raw: approxByteLength(point),
    binary: approxByteLength(PointView.encode(point)),
    perf_encode: stress(() => PointView.encode(point)),
    perf_decode: stress(() => PointView.decode(encoded)),
  },
})
