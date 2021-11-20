import { BufferReader } from 'arraybuffer-utils'
import { approxByteLength } from '../record/buffer-utils'
import {
  getByteLength,
  HEADER_16,
  HEADER_32,
  HEADER_8,
  LITTLE_ENDIAN,
} from './common'
import {
  documentNode,
  docTypeNode,
  elementNode,
  textNode,
  attributePatch,
  textPatch,
  addNodesPatch,
  removeNodesPatch,
} from './fixtures/vdom'
import {
  decodePatch,
  decodeVNode,
  encodePatch,
  encodeVNode,
  NODE_ID_BYTE_LENGTH,
  NODE_TYPE_BYTE_LENGTH,
  PATCH_TYPE_BYTE_LENGTH,
} from './vdom'

describe('VDOM codec', () => {
  it('should encode and decode a VDocument node', () => {
    const input = documentNode
    const buffer = encodeVNode(input)
    expect(buffer.byteLength).toBeLessThan(approxByteLength(input))
    expect(buffer.byteLength).toBe(
      NODE_TYPE_BYTE_LENGTH +
        NODE_ID_BYTE_LENGTH +
        HEADER_16 +
        input.children.length * NODE_ID_BYTE_LENGTH
    )

    const reader = new BufferReader(buffer, 0, LITTLE_ENDIAN)
    const output = decodeVNode(reader)
    expect(output).toEqual(input)
  })

  it('should encode and decode a VDocType node', () => {
    const input = docTypeNode
    const buffer = encodeVNode(input)
    expect(buffer.byteLength).toBeLessThan(approxByteLength(input))
    expect(buffer.byteLength).toBe(
      NODE_TYPE_BYTE_LENGTH +
        NODE_ID_BYTE_LENGTH +
        HEADER_8 +
        getByteLength(input.name) +
        HEADER_8 +
        getByteLength(input.publicId) +
        HEADER_8 +
        getByteLength(input.systemId)
    )

    const reader = new BufferReader(buffer, 0, LITTLE_ENDIAN)
    const output = decodeVNode(reader)
    expect(output).toEqual(input)
  })

  it('should encode and decode a VElement node', () => {
    const input = elementNode
    const buffer = encodeVNode(input)
    expect(buffer.byteLength).toBeLessThan(approxByteLength(input))
    expect(buffer.byteLength).toBe(
      NODE_TYPE_BYTE_LENGTH +
        NODE_ID_BYTE_LENGTH +
        HEADER_8 +
        getByteLength(input.tagName) +
        HEADER_16 +
        input.children.length * NODE_ID_BYTE_LENGTH +
        HEADER_16 +
        Object.entries(input.attributes)
          .flatMap(([key, value]) => [
            HEADER_8 + getByteLength(key),
            HEADER_16 + (value !== null ? getByteLength(value) : 0),
          ])
          .reduce((a, b) => a + b, 0)
    )

    const reader = new BufferReader(buffer, 0, LITTLE_ENDIAN)
    const output = decodeVNode(reader)
    expect(output).toEqual(input)
  })

  it('should encode and decode a VText node', () => {
    const input = textNode
    const buffer = encodeVNode(input)
    expect(buffer.byteLength).toBeLessThan(approxByteLength(input))
    expect(buffer.byteLength).toBe(
      NODE_TYPE_BYTE_LENGTH +
        NODE_ID_BYTE_LENGTH +
        HEADER_32 +
        getByteLength(input.value)
    )

    const reader = new BufferReader(buffer, 0, LITTLE_ENDIAN)
    const output = decodeVNode(reader)
    expect(output).toEqual(input)
  })

  it('should encode and decode an attribute patch', () => {
    const input = attributePatch
    const buffer = encodePatch(input)
    expect(buffer.byteLength).toBeLessThan(approxByteLength(input))
    expect(buffer.byteLength).toBe(
      PATCH_TYPE_BYTE_LENGTH +
        NODE_ID_BYTE_LENGTH +
        HEADER_8 +
        getByteLength(input.name) +
        HEADER_16 +
        getByteLength(input.value ?? '') +
        HEADER_16 +
        getByteLength(input.oldValue ?? '')
    )

    const reader = new BufferReader(buffer, 0, LITTLE_ENDIAN)
    const output = decodePatch(reader)
    expect(output).toEqual(input)
  })

  it('should encode and decode a text patch', () => {
    const input = textPatch
    const buffer = encodePatch(input)
    expect(buffer.byteLength).toBeLessThan(approxByteLength(input))
    expect(buffer.byteLength).toBe(
      PATCH_TYPE_BYTE_LENGTH +
        NODE_ID_BYTE_LENGTH +
        HEADER_32 +
        getByteLength(input.value ?? '') +
        HEADER_32 +
        getByteLength(input.oldValue ?? '')
    )

    const reader = new BufferReader(buffer, 0, LITTLE_ENDIAN)
    const output = decodePatch(reader)
    expect(output).toEqual(input)
  })

  it('should encode and decode an add-nodes patch', () => {
    const input = addNodesPatch
    const buffer = encodePatch(input)
    const reader = new BufferReader(buffer, 0, LITTLE_ENDIAN)
    const output = decodePatch(reader)

    expect(buffer.byteLength).toBeLessThan(approxByteLength(input))
    expect(output).toEqual(input)
  })

  it('should encode and decode a remove-nodes patch', () => {
    const input = removeNodesPatch
    const buffer = encodePatch(input)
    const reader = new BufferReader(buffer, 0, LITTLE_ENDIAN)
    const output = decodePatch(reader)

    expect(buffer.byteLength).toBeLessThan(approxByteLength(input))
    expect(output).toEqual(input)
  })
})
