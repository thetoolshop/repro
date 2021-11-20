import { Point } from '@/types/interaction'
import { BufferReader } from 'arraybuffer-utils'

export function encodePoint(point: Point): ArrayBuffer {
  return new Uint16Array(point).buffer
}

export function decodePoint(reader: BufferReader): Point {
  return [reader.readUint16(), reader.readUint16()]
}
