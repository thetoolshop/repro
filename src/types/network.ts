import type { SyntheticId } from './common'

export enum NetworkMessageType {
  HttpRequest = 'http-request',
  HttpResponse = 'http-response',
  WebSocketRequest = 'websocket-request',
  WebSocketResponse = 'websocket-response',
}

export interface HttpRequest {
  type: NetworkMessageType.HttpRequest
  correlationId: SyntheticId
  url: string
  method: string
  headers: Record<string, string>
  body: string
}

export interface HttpResponse {
  type: NetworkMessageType.HttpResponse
  correlationId: SyntheticId
  status: number
  headers: Record<string, string>
  body: Blob
}

export type NetworkMessage =
  | HttpRequest
  | HttpResponse
