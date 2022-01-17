import { BufferReader, BufferWriter } from 'arraybuffer-utils'
import {
  Interaction,
  InteractionType,
  KeyDown,
  KeyUp,
  PointerDown,
  PointerMove,
  PointerUp,
  Scroll,
  ViewportResize,
} from '@/types/interaction'
import { POINT_BYTE_LENGTH, readPoint, writePoint } from './point'
import {
  getByteLength,
  UINT_8,
  LITTLE_ENDIAN,
  readString8,
  writeString8,
} from './common'
import { NODE_ID_BYTE_LENGTH, readNodeId, writeNodeId } from './vdom'
import { SyntheticId } from '@/types/common'

const INTERACTION_TYPE_BYTE_LENGTH = 1
const SAMPLE_DURATION_BYTE_LENGTH = 2

export function encodeInteraction(interaction: Interaction): ArrayBuffer {
  switch (interaction.type) {
    case InteractionType.ViewportResize:
      return encodeViewportResize(interaction)

    case InteractionType.Scroll:
      return encodeScroll(interaction)

    case InteractionType.PointerMove:
      return encodePointerMove(interaction)

    case InteractionType.PointerUp:
      return encodePointerUp(interaction)

    case InteractionType.PointerDown:
      return encodePointerDown(interaction)

    case InteractionType.KeyUp:
      return encodeKeyUp(interaction)

    case InteractionType.KeyDown:
      return encodeKeyDown(interaction)
  }
}

export function decodeInteraction(reader: BufferReader): Interaction {
  const type: InteractionType = reader.readUint8()

  switch (type) {
    case InteractionType.ViewportResize:
      return decodeViewportResize(reader)

    case InteractionType.Scroll:
      return decodeScroll(reader)

    case InteractionType.PointerMove:
      return decodePointerMove(reader)

    case InteractionType.PointerUp:
      return decodePointerUp(reader)

    case InteractionType.PointerDown:
      return decodePointerDown(reader)

    case InteractionType.KeyUp:
      return decodeKeyUp(reader)

    case InteractionType.KeyDown:
      return decodeKeyDown(reader)
  }
}

export function encodeViewportResize(interaction: ViewportResize): ArrayBuffer {
  const byteLength =
    INTERACTION_TYPE_BYTE_LENGTH +
    POINT_BYTE_LENGTH +
    POINT_BYTE_LENGTH +
    SAMPLE_DURATION_BYTE_LENGTH

  const buffer = new ArrayBuffer(byteLength)
  const writer = new BufferWriter(buffer, 0, LITTLE_ENDIAN)

  writer.writeUint8(interaction.type)
  writePoint(writer, interaction.from)
  writePoint(writer, interaction.to)
  writer.writeUint16(interaction.duration)

  return buffer
}

export function decodeViewportResize(reader: BufferReader): ViewportResize {
  const type = InteractionType.ViewportResize
  const from = readPoint(reader)
  const to = readPoint(reader)
  const duration = reader.readUint16()

  return {
    type,
    from,
    to,
    duration,
  }
}

export function encodeScroll(interaction: Scroll): ArrayBuffer {
  const byteLength =
    INTERACTION_TYPE_BYTE_LENGTH +
    NODE_ID_BYTE_LENGTH +
    POINT_BYTE_LENGTH +
    POINT_BYTE_LENGTH +
    SAMPLE_DURATION_BYTE_LENGTH

  const buffer = new ArrayBuffer(byteLength)
  const writer = new BufferWriter(buffer, 0, LITTLE_ENDIAN)

  writer.writeUint8(interaction.type)
  writeNodeId(writer, interaction.target)
  writePoint(writer, interaction.from)
  writePoint(writer, interaction.to)
  writer.writeUint16(interaction.duration)

  return buffer
}

export function decodeScroll(reader: BufferReader): Scroll {
  const type = InteractionType.Scroll
  const target = readNodeId(reader)
  const from = readPoint(reader)
  const to = readPoint(reader)
  const duration = reader.readUint16()

  return {
    type,
    target,
    from,
    to,
    duration,
  }
}

export function encodePointerMove(interaction: PointerMove): ArrayBuffer {
  const byteLength =
    INTERACTION_TYPE_BYTE_LENGTH +
    POINT_BYTE_LENGTH +
    POINT_BYTE_LENGTH +
    SAMPLE_DURATION_BYTE_LENGTH

  const buffer = new ArrayBuffer(byteLength)
  const writer = new BufferWriter(buffer, 0, LITTLE_ENDIAN)

  writer.writeUint8(interaction.type)
  writePoint(writer, interaction.from)
  writePoint(writer, interaction.to)
  writer.writeUint16(interaction.duration)

  return buffer
}

export function decodePointerMove(reader: BufferReader): PointerMove {
  const type = InteractionType.PointerMove
  const from = readPoint(reader)
  const to = readPoint(reader)
  const duration = reader.readUint16()

  return {
    type,
    from,
    to,
    duration,
  }
}

function encodePointerUpDown(
  interaction: PointerUp | PointerDown
): ArrayBuffer {
  const byteLength =
    INTERACTION_TYPE_BYTE_LENGTH +
    UINT_8 +
    interaction.targets.length * NODE_ID_BYTE_LENGTH +
    POINT_BYTE_LENGTH

  const buffer = new ArrayBuffer(byteLength)
  const writer = new BufferWriter(buffer, 0, LITTLE_ENDIAN)

  writer.writeUint8(interaction.type)
  writer.writeUint8(interaction.targets.length)

  for (const nodeId of interaction.targets) {
    writeNodeId(writer, nodeId)
  }

  writePoint(writer, interaction.at)

  return buffer
}

function decodePointerUpDown(
  type: InteractionType.PointerUp | InteractionType.PointerDown,
  reader: BufferReader
): PointerUp | PointerDown {
  const targetsLength = reader.readUint8()
  const targets: Array<SyntheticId> = []

  for (let i = 0; i < targetsLength; i++) {
    targets.push(readNodeId(reader))
  }

  const at = readPoint(reader)

  return {
    type,
    targets,
    at,
  }
}

export function encodePointerUp(interaction: PointerUp): ArrayBuffer {
  return encodePointerUpDown(interaction)
}

export function decodePointerUp(reader: BufferReader): PointerUp {
  return decodePointerUpDown(InteractionType.PointerUp, reader) as PointerUp
}

export function encodePointerDown(interaction: PointerDown): ArrayBuffer {
  return encodePointerUpDown(interaction)
}

export function decodePointerDown(reader: BufferReader): PointerDown {
  return decodePointerUpDown(InteractionType.PointerDown, reader) as PointerDown
}

function encodeKeyUpDown(interaction: KeyUp | KeyDown): ArrayBuffer {
  const byteLength =
    INTERACTION_TYPE_BYTE_LENGTH + UINT_8 + getByteLength(interaction.key)

  const buffer = new ArrayBuffer(byteLength)
  const writer = new BufferWriter(buffer, 0, LITTLE_ENDIAN)

  writer.writeUint8(interaction.type)
  writeString8(writer, interaction.key)

  return buffer
}

function decodeKeyUpDown(
  type: InteractionType.KeyUp | InteractionType.KeyDown,
  reader: BufferReader
): KeyUp | KeyDown {
  const key = readString8(reader)
  return { type, key }
}

export function encodeKeyUp(interaction: KeyUp): ArrayBuffer {
  return encodeKeyUpDown(interaction)
}

export function decodeKeyUp(reader: BufferReader): KeyUp {
  return decodeKeyUpDown(InteractionType.KeyUp, reader) as KeyUp
}

export function encodeKeyDown(interaction: KeyDown): ArrayBuffer {
  return encodeKeyUpDown(interaction)
}

export function decodeKeyDown(reader: BufferReader): KeyDown {
  return decodeKeyUpDown(InteractionType.KeyDown, reader) as KeyDown
}
