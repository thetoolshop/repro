import { ArrayDescriptor, createView } from '@repro/typed-binary-encoder'

export const POINT_BYTE_LENGTH = 4

// type Point: array[2]<uint16>
export type Point = [number, number]
export const PointView = createView<Point, ArrayDescriptor>({
  type: 'array',
  size: 2,
  items: {
    type: 'integer',
    signed: false,
    bits: 16,
  },
})
