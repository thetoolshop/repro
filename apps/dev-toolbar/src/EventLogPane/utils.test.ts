import {
  InteractionEvent,
  InteractionType,
  Point,
  SourceEventType,
} from '@repro/domain'
import { collapseItemsIntoGroups } from './utils'

function createPointerMove(
  time: number,
  from: Point,
  to: Point
): InteractionEvent {
  return {
    type: SourceEventType.Interaction,
    time,
    data: {
      type: InteractionType.PointerMove,
      from,
      to,
      duration: 10,
    },
  }
}

function createScroll(time: number, from: Point, to: Point): InteractionEvent {
  return {
    type: SourceEventType.Interaction,
    time,
    data: {
      type: InteractionType.Scroll,
      target: 'foo',
      from,
      to,
      duration: 10,
    },
  }
}

describe('collapseItemsIntoGroups', () => {
  it('should create groups of consecutive interaction events', () => {
    const items = collapseItemsIntoGroups([
      createPointerMove(0, [0, 0], [10, 10]),
      createPointerMove(20, [10, 10], [20, 20]),
      createPointerMove(40, [20, 20], [30, 30]),
      createPointerMove(60, [30, 30], [40, 40]),
      createPointerMove(80, [40, 40], [50, 50]),
    ])

    expect(items).toEqual([
      {
        group: true,
        type: SourceEventType.Interaction,
        timeStart: 0,
        timeEnd: 80,
        events: [
          createPointerMove(0, [0, 0], [10, 10]),
          createPointerMove(20, [10, 10], [20, 20]),
          createPointerMove(40, [20, 20], [30, 30]),
          createPointerMove(60, [30, 30], [40, 40]),
          createPointerMove(80, [40, 40], [50, 50]),
        ],
      },
    ])
  })

  it('should not merge sample events of different types', () => {
    const items = collapseItemsIntoGroups([
      createPointerMove(0, [0, 0], [10, 10]),
      createScroll(20, [10, 10], [20, 20]),
      createPointerMove(40, [20, 20], [30, 30]),
      createPointerMove(60, [30, 30], [40, 40]),
    ])

    expect(items).toEqual([
      createPointerMove(0, [0, 0], [10, 10]),
      createScroll(20, [10, 10], [20, 20]),
      {
        group: true,
        type: SourceEventType.Interaction,
        timeStart: 40,
        timeEnd: 60,
        events: [
          createPointerMove(40, [20, 20], [30, 30]),
          createPointerMove(60, [30, 30], [40, 40]),
        ],
      },
    ])
  })

  it('should merge consecutive events into an existing group', () => {
    const items = collapseItemsIntoGroups([
      {
        group: true,
        type: SourceEventType.Interaction,
        timeStart: 0,
        timeEnd: 80,
        events: [
          createPointerMove(0, [0, 0], [10, 10]),
          createPointerMove(20, [10, 10], [20, 20]),
          createPointerMove(40, [20, 20], [30, 30]),
          createPointerMove(60, [30, 30], [40, 40]),
        ],
      },
      createPointerMove(80, [40, 40], [50, 50]),
    ])

    expect(items).toEqual([
      {
        group: true,
        type: SourceEventType.Interaction,
        timeStart: 0,
        timeEnd: 80,
        events: [
          createPointerMove(0, [0, 0], [10, 10]),
          createPointerMove(20, [10, 10], [20, 20]),
          createPointerMove(40, [20, 20], [30, 30]),
          createPointerMove(60, [30, 30], [40, 40]),
          createPointerMove(80, [40, 40], [50, 50]),
        ],
      },
    ])
  })
})
