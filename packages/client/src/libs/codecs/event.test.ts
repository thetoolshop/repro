import { LogLevel, MessagePartType } from '@/types/console'
import { InteractionType, PointerState } from '@/types/interaction'
import { NetworkMessageType, RequestType } from '@/types/network'
import {
  CloseRecordingEvent,
  ConsoleEvent,
  DOMPatchEvent,
  InteractionEvent,
  NetworkEvent,
  SnapshotEvent,
  SourceEventType,
} from '@/types/recording'
import { BufferReader } from 'arraybuffer-utils'
import { nanoid } from 'nanoid'
import { approxByteLength } from '../record/buffer-utils'
import { LITTLE_ENDIAN } from './common'
import { decodeEvent, encodeEvent } from './event'
import { addNodesPatch, elementNode, vtree } from './fixtures/vdom'

describe('Event codecs', () => {
  it('should encode and decode a snapshot event', () => {
    const input: SnapshotEvent = {
      type: SourceEventType.Snapshot,
      time: 123456,
      data: {
        dom: vtree,
        interaction: {
          pointer: [100, 100],
          pointerState: PointerState.Down,
          scroll: {
            [elementNode.id]: [0, 250],
          },
          viewport: [1200, 800],
        },
      },
    }

    const buffer = encodeEvent(input)
    const reader = new BufferReader(buffer, 0, LITTLE_ENDIAN)
    const output = decodeEvent(reader)

    expect(buffer.byteLength).toBeLessThan(approxByteLength(input))
    expect(output).toEqual(input)
  })

  it('should encode and decode a dom-patch event', () => {
    const input: DOMPatchEvent = {
      type: SourceEventType.DOMPatch,
      time: 123456,
      data: addNodesPatch,
    }

    const buffer = encodeEvent(input)
    const reader = new BufferReader(buffer, 0, LITTLE_ENDIAN)
    const output = decodeEvent(reader)

    expect(buffer.byteLength).toBeLessThan(approxByteLength(input))
    expect(output).toEqual(input)
  })

  it('should encode and decode an interaction event', () => {
    const input: InteractionEvent = {
      type: SourceEventType.Interaction,
      time: 123456,
      data: {
        type: InteractionType.ViewportResize,
        from: [0, 0],
        to: [100, 100],
        duration: 250,
      },
    }

    const buffer = encodeEvent(input)
    const reader = new BufferReader(buffer, 0, LITTLE_ENDIAN)
    const output = decodeEvent(reader)

    expect(buffer.byteLength).toBeLessThan(approxByteLength(input))
    expect(output).toEqual(input)
  })

  it('should encode and decode a network event', () => {
    const input: NetworkEvent = {
      type: SourceEventType.Network,
      time: 123456,
      data: {
        type: NetworkMessageType.FetchRequest,
        correlationId: nanoid(4),
        requestType: RequestType.Fetch,
        url: 'http://example.com',
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        body: new TextEncoder().encode(JSON.stringify({ foo: 'bar' })).buffer,
      },
    }

    const buffer = encodeEvent(input)
    const reader = new BufferReader(buffer, 0, LITTLE_ENDIAN)
    const output = decodeEvent(reader)

    expect(buffer.byteLength).toBeLessThan(approxByteLength(input))
    expect(output).toEqual(input)
  })

  it('should encode and decode a console event', () => {
    const input: ConsoleEvent = {
      type: SourceEventType.Console,
      time: 123456,
      data: {
        level: LogLevel.Error,
        parts: [
          {
            type: MessagePartType.String,
            value: 'Error: could not find property "foo" of undefined',
          },
        ],
        stack: [
          {
            functionName: 'foo',
            fileName: '/path/to/bar.js',
            lineNumber: 1,
            columnNumber: 234567,
          },
          {
            functionName: null,
            fileName: '/path/to/somewhere/else.js',
            lineNumber: 999999,
            columnNumber: 1,
          },
        ],
      },
    }

    const buffer = encodeEvent(input)
    const reader = new BufferReader(buffer, 0, LITTLE_ENDIAN)
    const output = decodeEvent(reader)

    expect(buffer.byteLength).toBeLessThan(approxByteLength(input))
    expect(output).toEqual(input)
  })

  it('should encode and decode a close-recording event', () => {
    const input: CloseRecordingEvent = {
      type: SourceEventType.CloseRecording,
      time: 123456,
    }

    const buffer = encodeEvent(input)
    const reader = new BufferReader(buffer, 0, LITTLE_ENDIAN)
    const output = decodeEvent(reader)

    expect(buffer.byteLength).toBeLessThan(approxByteLength(input))
    expect(output).toEqual(input)
  })
})
