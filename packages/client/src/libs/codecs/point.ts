import { Point } from '@/types/interaction'
import { ArrayDescriptor, createView } from '@/utils/encoding'

export const POINT_BYTE_LENGTH = 4

// type Point: array[2]<uint16>
export const PointView = createView<Point, ArrayDescriptor>({
  type: 'array',
  size: 2,
  items: {
    type: 'integer',
    signed: false,
    bits: 16,
  },
})
