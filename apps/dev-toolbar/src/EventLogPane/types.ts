import { SourceEvent, SourceEventType } from '@repro/domain'
import { Box } from '@repro/tdl'

export interface SourceEventGroup<T extends SourceEventType = SourceEventType> {
  group: true
  type: T
  timeStart: number
  timeEnd: number
  events: Array<SourceEvent & Box<{ type: T }>>
}

export type LogItem = SourceEvent | SourceEventGroup
