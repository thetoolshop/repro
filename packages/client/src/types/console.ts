import { SyntheticId } from './common'

export enum LogLevel {
  Verbose = 0,
  Info = 1,
  Warning = 2,
  Error = 3,
}

export enum MessagePartType {
  String = 0,
  Node = 1,
}

export interface StringMessagePart {
  type: MessagePartType.String
  value: string
}

export interface NodeMessagePart {
  type: MessagePartType.Node
  nodeId: SyntheticId
}

export type MessagePart = StringMessagePart | NodeMessagePart

export interface StackEntry {
  functionName: string | null
  fileName: string
  lineNumber: number
  columnNumber: number
}

export interface ConsoleMessage {
  level: LogLevel
  parts: Array<MessagePart>
  stack: Array<StackEntry>
}

export interface ConsoleSnapshot {
  messages: Array<{
    time: number
    data: ConsoleMessage
  }>
}
