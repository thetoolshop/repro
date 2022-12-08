import {
  PointerRef,
  createDataView,
  createPointerRef,
  getByteLength,
} from './common'

export interface CharDescriptor {
  type: 'char'
  bytes: number
  nullable?: boolean
}

const textDecoder = new TextDecoder()
const textEncoder = new TextEncoder()

export function getChar(
  descriptor: CharDescriptor,
  view: DataView,
  byteOffset: number
) {
  const { bytes } = descriptor
  const data = textDecoder.decode(new DataView(view.buffer, byteOffset, bytes))
  byteOffset += bytes

  return data
}

export function encodeChar(
  descriptor: CharDescriptor,
  data: string,
  view: DataView = createDataView(getByteLength(descriptor, data)),
  pointerRef: PointerRef = createPointerRef()
) {
  const { bytes } = descriptor
  const dest = new Uint8Array(view.buffer, pointerRef.offset)
  textEncoder.encodeInto(data, dest)
  pointerRef.offset += bytes
  return view
}
