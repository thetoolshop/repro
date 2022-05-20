import { BufferReader, BufferWriter } from 'arraybuffer-utils'

import {
  ConsoleMessage,
  MessagePart,
  MessagePartType,
  NodeMessagePart,
  StackEntry,
  StringMessagePart,
} from '@/types/console'

import {
  concat,
  getByteLength,
  LITTLE_ENDIAN,
  readString16,
  readString32,
  readString8,
  UINT_16,
  UINT_32,
  UINT_8,
  writeString16,
  writeString32,
  writeString8,
} from './common'

import { NODE_ID_BYTE_LENGTH, readNodeId, writeNodeId } from './vdom'

function encodeStringMessagePart(part: StringMessagePart): ArrayBuffer {
  const byteLength = UINT_8 + UINT_32 + getByteLength(part.value)
  const buffer = new ArrayBuffer(byteLength)
  const writer = new BufferWriter(buffer, 0, LITTLE_ENDIAN)

  writer.writeUint8(part.type)
  writeString32(writer, part.value)

  return buffer
}

function decodeStringMessagePart(reader: BufferReader): StringMessagePart {
  const type = MessagePartType.String
  const value = readString32(reader)
  return { type, value }
}

function encodeNodeMessagePart(part: NodeMessagePart): ArrayBuffer {
  const byteLength = UINT_8 + NODE_ID_BYTE_LENGTH
  const buffer = new ArrayBuffer(byteLength)
  const writer = new BufferWriter(buffer, 0, LITTLE_ENDIAN)

  writer.writeUint8(part.type)
  writeNodeId(writer, part.nodeId)

  return buffer
}

function decodeNodeMessagePart(reader: BufferReader): NodeMessagePart {
  const type = MessagePartType.Node
  const nodeId = readNodeId(reader)
  return { type, nodeId }
}

function encodeStackEntry(entry: StackEntry): ArrayBuffer {
  const buffers: Array<ArrayBuffer> = []

  buffers.push(new Uint8Array([entry.functionName ? 1 : 0]).buffer)

  if (entry.functionName) {
    const byteLength = UINT_8 + getByteLength(entry.functionName)
    const buffer = new ArrayBuffer(byteLength)
    const writer = new BufferWriter(buffer, 0, LITTLE_ENDIAN)
    writeString8(writer, entry.functionName)
    buffers.push(buffer)
  }

  const byteLength = UINT_16 + getByteLength(entry.fileName)
  const buffer = new ArrayBuffer(byteLength)
  const writer = new BufferWriter(buffer, 0, LITTLE_ENDIAN)
  writeString16(writer, entry.fileName)
  buffers.push(buffer)

  buffers.push(
    new Uint32Array([entry.lineNumber]).buffer,
    new Uint32Array([entry.columnNumber]).buffer
  )

  return concat(buffers)
}

function decodeStackEntry(reader: BufferReader): StackEntry {
  const hasFunctionName = reader.readUint8()
  const functionName = hasFunctionName ? readString8(reader) : null
  const fileName = readString16(reader)
  const lineNumber = reader.readUint32()
  const columnNumber = reader.readUint32()

  return {
    functionName,
    fileName,
    lineNumber,
    columnNumber,
  }
}

export function encodeConsoleMessage(message: ConsoleMessage): ArrayBuffer {
  return concat([
    new Uint8Array([message.level]).buffer,
    new Uint16Array([message.parts.length]).buffer,
    ...message.parts.map(part => {
      return part.type === MessagePartType.String
        ? encodeStringMessagePart(part)
        : encodeNodeMessagePart(part)
    }),
    new Uint8Array([message.stack.length]).buffer,
    ...message.stack.map(entry => encodeStackEntry(entry)),
  ])
}

export function decodeConsoleMessage(reader: BufferReader): ConsoleMessage {
  const level = reader.readUint8()
  const parts: Array<MessagePart> = []
  const partsLength = reader.readUint16()

  for (let i = 0; i < partsLength; i++) {
    const type = reader.readUint8()

    switch (type) {
      case MessagePartType.String:
        parts.push(decodeStringMessagePart(reader))
        break

      case MessagePartType.Node:
        parts.push(decodeNodeMessagePart(reader))
        break
    }
  }

  const stack: Array<StackEntry> = []
  const stackLength = reader.readUint8()

  for (let i = 0; i < stackLength; i++) {
    stack.push(decodeStackEntry(reader))
  }

  return { level, parts, stack }
}
