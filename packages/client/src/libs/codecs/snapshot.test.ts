import { BufferReader } from 'arraybuffer-utils'
import { PointerState } from '@/types/interaction'
import { Snapshot } from '@/types/recording'
import { approxByteLength } from '../record/buffer-utils'
import { LITTLE_ENDIAN } from './common'
import { elementNode, vtree } from './fixtures/vdom'
import { decodeSnapshot, encodeSnapshot } from './snapshot'
import { LogLevel, MessagePartType } from '@/types/console'
import {
  BinaryType,
  NetworkMessageType,
  RequestType,
  WebSocketStatus,
} from '@/types/network'

describe('Snapshot codecs', () => {
  it('should encode and decode a full snapshot', () => {
    const input: Snapshot = {
      dom: vtree,

      interaction: {
        pointer: [100, 100],
        pointerState: PointerState.Down,
        scroll: {
          [elementNode.id]: [0, 250],
        },
        viewport: [1200, 800],
      },

      network: {
        fetchRequests: {
          data: {
            1234: {
              correlationId: '1234',
              request: {
                type: NetworkMessageType.FetchRequest,
                correlationId: '1234',
                requestType: RequestType.Fetch,
                url: 'http://example.com',
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: new ArrayBuffer(0),
              },
              response: {
                type: NetworkMessageType.FetchResponse,
                correlationId: '1234',
                status: 200,
                headers: {
                  'Content-Type': 'application/json',
                },
                body: new TextEncoder().encode(`{ "foo": "bar" }`).buffer,
              },
              startAt: 100,
              endAt: 350,
            },
          },
          index: ['1234'],
        },

        websockets: {
          data: {
            1234: {
              connectionId: '1234',
              url: 'ws://example.com',
              status: WebSocketStatus.Connected,
              messages: [
                {
                  type: NetworkMessageType.WebSocketInbound,
                  connectionId: '1234',
                  binaryType: BinaryType.ArrayBuffer,
                  data: new TextEncoder().encode(`{ "bar": "baz" }`).buffer,
                },
              ],
              startAt: 300,
              endAt: null,
            },
          },
          index: ['1234'],
        },
      },

      console: {
        messages: [
          {
            time: 100,
            data: {
              level: LogLevel.Info,
              parts: [
                {
                  type: MessagePartType.String,
                  value: 'foo',
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
          },
        ],
      },
    }

    const buffer = encodeSnapshot(input)
    const reader = new BufferReader(buffer, 0, LITTLE_ENDIAN)
    const output = decodeSnapshot(reader)

    expect(buffer.byteLength).toBeLessThan(approxByteLength(input))
    expect(output).toEqual(input)
  })
})
