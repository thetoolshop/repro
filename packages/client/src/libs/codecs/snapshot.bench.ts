import { approxByteLength } from '@/libs/record/buffer-utils'
import { PointerState } from '@/types/interaction'
import {
  BinaryType,
  NetworkEventType,
  RequestType,
  WebSocketStatus,
} from '@/types/network'
import { Snapshot } from '@/types/recording'
import { stress } from '@/utils/bench'
import {
  documentNode,
  docTypeNode,
  elementNode,
  textNode,
} from './fixtures/vdom'
import { encodeSnapshot } from './snapshot'

const snapshot: Snapshot = {
  dom: {
    rootId: documentNode.id,
    nodes: {
      [documentNode.id]: documentNode,
      [docTypeNode.id]: docTypeNode,
      [elementNode.id]: elementNode,
      [textNode.id]: textNode,
    },
  },

  interaction: {
    pointer: [960, 640],
    pointerState: PointerState.Up,
    scroll: {
      [documentNode.id]: [0, 0],
      [elementNode.id]: [50, 250],
    },
    viewport: [1200, 800],
  },

  network: {
    fetchRequests: {
      data: {
        1234: {
          correlationId: '1234',
          request: {
            type: NetworkEventType.FetchRequest,
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
            type: NetworkEventType.FetchResponse,
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
              type: NetworkEventType.WebSocketInbound,
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
}

console.table({
  Snapshot: {
    raw: approxByteLength(snapshot),
    binary: approxByteLength(encodeSnapshot(snapshot)),
    perf_encode: stress(() => encodeSnapshot(snapshot)),
  },
})
