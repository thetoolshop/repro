import { InteractionEvent, SourceEvent, SourceEventType } from '@repro/domain'
import { isSample } from '@repro/source-utils'
import { Box } from '@repro/tdl'
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
  const aType = isGroup(a) ? new Box(a.type) : a.get('type')
  const bType = isGroup(b) ? new Box(b.type) : b.get('type')

  const isSameType = aType.equals(bType)
  const isInteractionEvent = aType.match(
    type => type === SourceEventType.Interaction
  )

  if (isSameType && isInteractionEvent) {
    const aFirst = unpackFirstEvent(a) as Box<InteractionEvent> | null
    const bFirst = unpackFirstEvent(b) as Box<InteractionEvent> | null

    if (aFirst != null && bFirst != null) {
      const aType = aFirst.flatMap(event => event.data.get('type'))
      const bType = bFirst.flatMap(event => event.data.get('type'))

      if (!aType.equals(bType)) {
        return false
      }
    }

    return aFirst !== null && isSample(aFirst.get('data').flat())
  }

  return false
}

export function collapseItemsIntoGroups(items: Array<LogItem>): Array<LogItem> {
  const nextItems: Array<LogItem> = []
  let target: LogItem | null = null

  for (const item of items) {
    if (!isGroup(item) && item.empty()) {
      continue
    }

    if (target == null) {
      target = item
    } else if (shouldCollapseItems(target, item)) {
      if (isGroup(target) && isGroup(item)) {
        target.events.push(...item.events)
        target.timeEnd = item.timeEnd
      } else if (isGroup(target) && !isGroup(item)) {
        target.events.push(item)
        target.timeEnd = item.get('time').orElse(0)
      } else if (isGroup(item) && !isGroup(target)) {
        item.events.unshift(target)
        item.timeStart = target.get('time').orElse(0)
        target = item
      } else {
        const left = target as SourceEvent
        const right = item as SourceEvent

        target = {
          type: left.get('type').unwrap(),
          group: true,
          events: [left, right],
          timeStart: left.get('time').orElse(0),
          timeEnd: right.get('time').orElse(0),
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
