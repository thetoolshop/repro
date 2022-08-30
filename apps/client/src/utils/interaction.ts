import { Point } from '@repro/domain'

export function isZeroPoint(point: Point) {
  return point[0] === 0 && point[1] === 0
}
