import { BufferReader } from 'arraybuffer-utils'
import { approxByteLength } from '../record/buffer-utils'
import {
  getByteLength,
  UINT_16,
  UINT_32,
  UINT_8,
  LITTLE_ENDIAN,
  INT_32,
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
  numberPropertyPatch,
  textPropertyPatch,
  booleanPropertyPatch,
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
        UINT_16 +
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
        UINT_8 +
        getByteLength(input.name) +
        UINT_8 +
        getByteLength(input.publicId) +
        UINT_8 +
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
        UINT_8 +
        getByteLength(input.tagName) +
        UINT_16 +
        input.children.length * NODE_ID_BYTE_LENGTH +
        UINT_16 +
        Object.entries(input.attributes)
          .flatMap(([key, value]) => [
            UINT_8 + getByteLength(key),
            UINT_16 + (value !== null ? getByteLength(value) : 0),
          ])
          .reduce((a, b) => a + b, 0) +
        UINT_16 +
        Object.entries(input.properties)
          .flatMap(([key, value]) => [
            UINT_8,
            UINT_8 + getByteLength(key),
            typeof value === 'string'
              ? UINT_32 + getByteLength(value)
              : typeof value === 'number'
              ? INT_32
              : UINT_8,
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
        UINT_32 +
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
        UINT_8 +
        getByteLength(input.name) +
        UINT_16 +
        getByteLength(input.value ?? '') +
        UINT_16 +
        getByteLength(input.oldValue ?? '')
    )

    const reader = new BufferReader(buffer, 0, LITTLE_ENDIAN)
    const output = decodePatch(reader)
    expect(output).toEqual(input)
  })

  it('should encode and decode a text property patch', () => {
    const input = textPropertyPatch
    const buffer = encodePatch(input)
    expect(buffer.byteLength).toBeLessThan(approxByteLength(input))
    expect(buffer.byteLength).toBe(
      PATCH_TYPE_BYTE_LENGTH +
        NODE_ID_BYTE_LENGTH +
        UINT_8 +
        getByteLength(input.name) +
        UINT_32 +
        getByteLength(input.value) +
        UINT_32 +
        getByteLength(input.oldValue)
    )

    const reader = new BufferReader(buffer, 0, LITTLE_ENDIAN)
    const output = decodePatch(reader)
    expect(output).toEqual(input)
  })

  it('should encode and decode a number property patch', () => {
    const input = numberPropertyPatch
    const buffer = encodePatch(input)
    expect(buffer.byteLength).toBeLessThan(approxByteLength(input))
    expect(buffer.byteLength).toBe(
      PATCH_TYPE_BYTE_LENGTH +
        NODE_ID_BYTE_LENGTH +
        UINT_8 +
        getByteLength(input.name) +
        INT_32 +
        INT_32
    )
  })

  it('should encode and decode a boolean property patch', () => {
    const input = booleanPropertyPatch
    const buffer = encodePatch(input)
    expect(buffer.byteLength).toBeLessThan(approxByteLength(input))
    expect(buffer.byteLength).toBe(
      PATCH_TYPE_BYTE_LENGTH +
        NODE_ID_BYTE_LENGTH +
        UINT_8 +
        getByteLength(input.name) +
        UINT_8 +
        UINT_8
    )
  })

  it('should encode and decode a text patch', () => {
    const input = textPatch
    const buffer = encodePatch(input)
    expect(buffer.byteLength).toBeLessThan(approxByteLength(input))
    expect(buffer.byteLength).toBe(
      PATCH_TYPE_BYTE_LENGTH +
        NODE_ID_BYTE_LENGTH +
        UINT_32 +
        getByteLength(input.value ?? '') +
        UINT_32 +
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
