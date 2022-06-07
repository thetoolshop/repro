import {
  FetchRequest,
  FetchResponse,
  NetworkMessage,
  NetworkMessageType,
  WebSocketClose,
  WebSocketInbound,
  WebSocketOpen,
  WebSocketOutbound,
} from '@/types/network'
import {
  CharDescriptor,
  createView,
  StructDescriptor,
  UINT16,
  UINT8,
  UnionDescriptor,
} from '@/utils/encoding'

export const NETWORK_EVENT_TYPE_BYTE_LENGTH = 1
export const CORRELATION_ID_BYTE_LENGTH = 4
export const REQUEST_INITIATOR_BYTE_LENGTH = 1
export const CONNECTION_ID_BYTE_LENGTH = 4
export const BINARY_TYPE_BYTE_LENGTH = 1

// type CorrelationId: char[4]

// type NetworkMessageType: enum<uint8> {
//   2: FetchRequest
//   3: FetchResponse
//   4: WebSocketOutbound
//   5: WebSocketInbound
//   6: WebSocketOpen
//   7: WebSocketClose
// }

// type RequestType: enum<uint8> {
//   0: Fetch
//   1: XHR
// }

// type FetchRequest: struct {
//   type: NetworkMessageType.FetchRequest
//   correlationId: CorrelationId
//   requestType: RequestType
//   url: string
//   method: string
//   headers: map<string, string>
//   body: buffer
// }

const CorrelationId: CharDescriptor = {
  type: 'char',
  bytes: 4,
}

export const FetchRequestView = createView<FetchRequest, StructDescriptor>({
  type: 'struct',
  fields: [
    ['type', UINT8],
    ['correlationId', CorrelationId],
    ['requestType', UINT8],
    ['url', { type: 'string' }],
    ['method', { type: 'string' }],
    [
      'headers',
      { type: 'dict', key: { type: 'string' }, value: { type: 'string' } },
    ],
    ['body', { type: 'buffer' }],
  ],
})

// type FetchResponse: struct {
//   type: NetworkMessageType.FetchResponse
//   correlationId: CorrelationId
//   status: uint16
//   headers: map<string, string>
//   body: buffer
// }

export const FetchResponseView = createView<FetchResponse, StructDescriptor>({
  type: 'struct',
  fields: [
    ['type', UINT8],
    ['correlationId', CorrelationId],
    ['status', UINT16],
    [
      'headers',
      { type: 'dict', key: { type: 'string' }, value: { type: 'string' } },
    ],
    ['body', { type: 'buffer' }],
  ],
})

// type ConnectionId: char[4]

// type WebSocketOpen: struct {
//   type: NetworkMessageType.WebSocketOpen
//   connectionId: ConnectionId
//   url: string
// }

const ConnectionId: CharDescriptor = {
  type: 'char',
  bytes: 4,
}

export const WebSocketOpenView = createView<WebSocketOpen, StructDescriptor>({
  type: 'struct',
  fields: [
    ['type', UINT8],
    ['connectionId', ConnectionId],
    ['url', { type: 'string' }],
  ],
})

// type WebSocketClose: struct {
//   type: NetworkMessageType.WebSocketClose
//   connectionId: ConnectionId
// }

export const WebSocketCloseView = createView<WebSocketClose, StructDescriptor>({
  type: 'struct',
  fields: [
    ['type', UINT8],
    ['connectionId', ConnectionId],
  ],
})

// type BinaryType: enum<uint8> {
//   0: Blob
//   1: ArrayBuffer
// }

// type WebSocketInbound: struct {
//   type: NetworkMessageType.WebSocketInbound
//   connectionId: ConnectionId
//   binaryType: BinaryType
//   data: buffer
// }

export const WebSocketInboundView = createView<
  WebSocketInbound,
  StructDescriptor
>({
  type: 'struct',
  fields: [
    ['type', UINT8],
    ['connectionId', ConnectionId],
    ['binaryType', UINT8],
    ['data', { type: 'buffer' }],
  ],
})

// type WebSocketOutbound: struct {
//   type: NetworkMessageType.WebSocketOutbound
//   connectionId: ConnectionId
//   binaryType: BinaryType
//   data: buffer
// }

export const WebSocketOutboundView = createView<
  WebSocketOutbound,
  StructDescriptor
>({
  type: 'struct',
  fields: [
    ['type', UINT8],
    ['connectionId', ConnectionId],
    ['binaryType', UINT8],
    ['data', { type: 'buffer' }],
  ],
})

export const NetworkMessageView = createView<NetworkMessage, UnionDescriptor>({
  type: 'union',
  tagField: 'type',
  descriptors: {
    [NetworkMessageType.FetchRequest]: FetchRequestView.descriptor,
    [NetworkMessageType.FetchResponse]: FetchResponseView.descriptor,
    [NetworkMessageType.WebSocketOpen]: WebSocketOpenView.descriptor,
    [NetworkMessageType.WebSocketClose]: WebSocketCloseView.descriptor,
    [NetworkMessageType.WebSocketOutbound]: WebSocketOutboundView.descriptor,
    [NetworkMessageType.WebSocketInbound]: WebSocketInboundView.descriptor,
  },
})
