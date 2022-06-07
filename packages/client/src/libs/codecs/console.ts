import {
  ConsoleMessage,
  ConsoleSnapshot,
  MessagePartType,
} from '@/types/console'
import { createView, StructDescriptor, UINT8 } from '@/utils/encoding'
import { NodeId } from './vdom'

// type LogLevel: enum<uint8> {
//   Verbose = 0
//   Info = 1
//   Warning = 2
//   Error = 3
// }

// type MessagePart: union(tag='type') {
//   StringMessagePart
//   NodeMessagePart
// }

// type StackEntry: struct {
//   functionName?: string
//   fileName: string
//   lineNumber: uint32
//   columnNumber: uint32
// }

// type ConsoleMessage: struct {
//   level: LogLevel
//   parts: list<MessagePart>
//   stack: list<StackEntry>
// }

export const ConsoleMessageView = createView<ConsoleMessage, StructDescriptor>({
  type: 'struct',
  fields: [
    ['level', UINT8],
    [
      'parts',
      {
        type: 'vector',
        items: {
          type: 'union',
          tagField: 'type',
          descriptors: {
            [MessagePartType.String]: {
              type: 'struct',
              fields: [
                ['type', UINT8],
                ['value', { type: 'string' }],
              ],
            },

            [MessagePartType.Node]: {
              type: 'struct',
              fields: [
                ['type', UINT8],
                ['nodeId', NodeId],
              ],
            },
          },
        },
      },
    ],
    [
      'stack',
      {
        type: 'vector',
        items: {
          type: 'struct',
          fields: [
            ['functionName', { type: 'string', nullable: true }],
            ['fileName', { type: 'string' }],
            ['lineNumber', { type: 'integer', signed: false, bits: 32 }],
            ['columnNumber', { type: 'integer', signed: false, bits: 32 }],
          ],
        },
      },
    ],
  ],
})

// type ConsoleSnapshot: struct {
//   messages: list<struct {
//     time: uint32
//     data: ConsoleMessage
//   }>
// }

export const ConsoleSnapshotView = createView<
  ConsoleSnapshot,
  StructDescriptor
>({
  type: 'struct',
  fields: [
    [
      'messages',
      {
        type: 'vector',
        items: {
          type: 'struct',
          fields: [
            ['time', { type: 'integer', signed: false, bits: 32 }],
            ['data', ConsoleMessageView.descriptor],
          ],
        },
      },
    ],
  ],
})
