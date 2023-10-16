import { InteractionEvent, SourceEvent, SourceEventType } from '@repro/domain'
import { isSample } from '../../../../../packages/source-utils/dist'
import { LogItem, SourceEventGroup } from './types'

export function isGroup(item: LogItem): item is SourceEventGroup {
  return 'group' in item && item.group
}

export function unpackFirstEvent(item: LogItem): SourceEvent | null {
  if (isGroup(item)) {
    return item.events[0] ?? null
  }

  return item
}

function shouldCollapseItems(a: LogItem, b: LogItem): boolean {
  const isSameType = a.type === b.type
  const isInteractionEvent = a.type === SourceEventType.Interaction

  if (isSameType && isInteractionEvent) {
    const aFirst = unpackFirstEvent(a) as InteractionEvent | null
    const bFirst = unpackFirstEvent(b) as InteractionEvent | null

    if (aFirst !== null && bFirst !== null) {
      if (aFirst.data.type !== bFirst.data.type) {
        return false
      }
    }

    return aFirst !== null && isSample(aFirst.data)
  }

  return false
}

export function collapseItemsIntoGroups(items: Array<LogItem>): Array<LogItem> {
  const nextItems: Array<LogItem> = []
  let target: LogItem | null = null

  for (const item of items) {
    if (target === null) {
      target = item
    } else if (shouldCollapseItems(target, item)) {
      if (isGroup(target) && isGroup(item)) {
        target.events.push(...item.events)
        target.timeEnd = item.timeEnd
      } else if (isGroup(target) && !isGroup(item)) {
        target.events.push(item)
        target.timeEnd = item.time
      } else if (isGroup(item) && !isGroup(target)) {
        item.events.unshift(target)
        item.timeStart = target.time
        target = item
      } else {
        const left = target as SourceEvent
        const right = item as SourceEvent

        target = {
          type: left.type,
          group: true,
          events: [left, right],
          timeStart: left.time,
          timeEnd: right.time,
        }
      }
    } else {
      nextItems.push(target)
      target = item
    }
  }

  if (target !== null) {
    nextItems.push(target)
  }

  return nextItems
}
