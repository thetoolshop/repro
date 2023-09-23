import { SourceEvent, SourceEventType } from '@repro/domain'

export interface SourceEventGroup<T extends SourceEventType = SourceEventType> {
  group: true
  type: T
  timeStart: number
  timeEnd: number
  events: Array<SourceEvent & { type: T }>
}

export type LogItem = SourceEvent | SourceEventGroup
