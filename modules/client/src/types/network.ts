import type { SyntheticId } from './common'

export interface Request {
  correlationId: SyntheticId
  url: string
  method: string
  headers: Record<string, string>
  body: string
}

export interface Response {
  correlationId: SyntheticId
  status: number
  headers: Record<string, string>
  body: Blob
}
