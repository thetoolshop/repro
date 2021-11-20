import { approxByteLength } from '@/libs/record/buffer-utils'
import { Point } from '@/types/interaction'
import { stress } from '@/utils/bench'
import { encodePoint } from './point'

const point: Point = [1000, 1000]

console.table({
  Point: {
    raw: approxByteLength(point),
    binary: approxByteLength(encodePoint(point)),
    perf_encode: stress(() => encodePoint(point)),
  },
})
