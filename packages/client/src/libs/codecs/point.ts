import { Point } from '@/types/interaction'
import { BufferReader, BufferWriter } from 'arraybuffer-utils'
import { LITTLE_ENDIAN } from './common'

export const POINT_BYTE_LENGTH = 4

export function writePoint(writer: BufferWriter, point: Point) {
  writer.writeUint16(point[0]).writeUint16(point[1])
}

export function readPoint(reader: BufferReader): Point {
  return [reader.readUint16(), reader.readUint16()]
}

export function encodePoint(point: Point): ArrayBuffer {
  const buffer = new ArrayBuffer(POINT_BYTE_LENGTH)
  const writer = new BufferWriter(buffer, 0, LITTLE_ENDIAN)
  writePoint(writer, point)
  return buffer
}

export function decodePoint(reader: BufferReader): Point {
  return readPoint(reader)
}
