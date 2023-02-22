import { randomString } from '@repro/random-string'
import { approxByteLength } from '@repro/typed-binary-encoder'
import {
  PerformanceEntryType,
  PerformanceEntryView,
  ResourceTiming,
  ResourceTimingView,
} from './performance'

describe('Performance codecs', () => {
  it('should create a binary view from a resource timing', () => {
    const input: ResourceTiming = {
      type: PerformanceEntryType.ResourceTiming,
      id: randomString(4),
      url: 'https://example.com/foo.png',
      startTime: 1234,
      domainLookupStart: 2345,
      domainLookupEnd: 3456,
      connectStart: 4567,
      secureConnectionStart: 5678,
      connectEnd: 6789,
      requestStart: 7890,
      responseStart: 8901,
      responseEnd: 9012,
      encodedBodySize: 12345,
      decodedBodySize: 23456,
      transferSize: 34567,
    }

    const buffer = ResourceTimingView.encode(input)
    const view = ResourceTimingView.from(input)
    const envelope = PerformanceEntryView.from(input)

    expect(buffer.byteLength).toBeLessThan(approxByteLength(input))
    expect(view).toEqual(input)
    expect(envelope).toEqual(input)
  })
})
