import { ArrayDescriptor, createView } from '@repro/typed-binary-encoder'
import z from 'zod'

export const POINT_BYTE_LENGTH = 4

// type Point: array[2]<uint16>
const uint16Schema = z
  .number()
  .min(0)
  .max(2 ** 16 - 1)
export const PointSchema = z.tuple([uint16Schema, uint16Schema])
export type Point = z.infer<typeof PointSchema>
export const PointView = createView<Point, ArrayDescriptor>(
  {
    type: 'array',
    size: 2,
    items: {
      type: 'integer',
      signed: false,
      bits: 16,
    },
  },
  PointSchema
)
