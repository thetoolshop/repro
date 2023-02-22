import { createView, UINT32, UINT8 } from '@repro/typed-binary-encoder'
import z from 'zod'
import { uint32 } from './common'

export enum PerformanceEntryType {
  ResourceTiming = 0,
}

export const PerformanceEntryTypeSchema = z.nativeEnum<
  typeof PerformanceEntryType
>

// type ResourceTiming: struct {
//   type: PerformanceEntryType.ResourceTiming
//
//   id: char[4]
//   url: string
//
//   startTime: uint32
//   domainLookupStart: uint32
//   domainLookupEnd: uint32
//   connectStart: uint32
//   secureConnectionStart: uint32
//   connectEnd: uint32
//   requestStart: uint32
//   responseStart: uint32
//   responseEnd: uint32
//
//   encodedBodySize: uint32
//   decodedBodySize: uint32
//   transferSize: uint32
// }

export const ResourceTimingSchema = z.object({
  type: z.literal(PerformanceEntryType.ResourceTiming),
  id: z.string().length(4),
  url: z.string(),
  startTime: uint32,
  domainLookupStart: uint32,
  domainLookupEnd: uint32,
  connectStart: uint32,
  secureConnectionStart: uint32,
  connectEnd: uint32,
  requestStart: uint32,
  responseStart: uint32,
  responseEnd: uint32,
  encodedBodySize: uint32,
  decodedBodySize: uint32,
  transferSize: uint32,
})

export type ResourceTiming = z.infer<typeof ResourceTimingSchema>

export const ResourceTimingView = createView(
  {
    type: 'struct',
    fields: [
      ['type', UINT8],
      ['id', { type: 'char', bytes: 4 }],
      ['url', { type: 'string' }],
      ['startTime', UINT32],
      ['domainLookupStart', UINT32],
      ['domainLookupEnd', UINT32],
      ['connectStart', UINT32],
      ['secureConnectionStart', UINT32],
      ['connectEnd', UINT32],
      ['requestStart', UINT32],
      ['responseStart', UINT32],
      ['responseEnd', UINT32],
      ['encodedBodySize', UINT32],
      ['decodedBodySize', UINT32],
      ['transferSize', UINT32],
    ],
  },
  ResourceTimingSchema
)

// @ts-ignore
// zod typings require discriminated unions to have at least two types
export const PerformanceEntrySchema = z.discriminatedUnion('type', [
  ResourceTimingSchema,
])

export type PerformanceEntry = z.infer<typeof PerformanceEntrySchema>

export const PerformanceEntryView = createView(
  {
    type: 'union',
    tagField: 'type',
    descriptors: {
      [PerformanceEntryType.ResourceTiming]: ResourceTimingView.descriptor,
    },
  },
  PerformanceEntrySchema
)
