import { ZodType, ZodTypeDef } from 'zod'

export interface IntegerDescriptor {
  type: 'integer'
  signed: boolean
  bits: 8 | 16 | 32
  nullable?: boolean
}

export interface CharDescriptor {
  type: 'char'
  bytes: number
  nullable?: boolean
}

export interface StringDescriptor {
  type: 'string'
  nullable?: boolean
}

export interface BooleanDescriptor {
  type: 'bool'
  nullable?: boolean
}

export interface BufferDescriptor {
  type: 'buffer'
  nullable?: boolean
}

export interface ArrayDescriptor {
  type: 'array'
  size: number
  items: IntegerDescriptor | CharDescriptor | BooleanDescriptor
  nullable?: boolean
}

export interface VectorDescriptor {
  type: 'vector'
  items: AnyDescriptor
  nullable?: boolean
}

export interface DictDescriptor {
  type: 'dict'
  key: StringDescriptor | CharDescriptor
  value: AnyDescriptor
  nullable?: boolean
}

export interface StructDescriptor {
  type: 'struct'
  fields: Array<[string, AnyDescriptor]>
  nullable?: boolean
}

export interface UnionDescriptor {
  type: 'union'
  tagField: string
  descriptors: Record<number, StructDescriptor>
  nullable?: boolean
}

export type AnyDescriptor =
  | IntegerDescriptor
  | CharDescriptor
  | StringDescriptor
  | BooleanDescriptor
  | BufferDescriptor
  | VectorDescriptor
  | ArrayDescriptor
  | DictDescriptor
  | StructDescriptor
  | UnionDescriptor

interface PointerRef {
  offset: number
}

const LITTLE_ENDIAN = true

const u8 = 1
const u16 = 2
const u32 = 4

export const UINT8: IntegerDescriptor = {
  type: 'integer',
  signed: false,
  bits: 8,
}

export const UINT16: IntegerDescriptor = {
  type: 'integer',
  signed: false,
  bits: 16,
}

export const UINT32: IntegerDescriptor = {
  type: 'integer',
  signed: false,
  bits: 32,
}

export const INT8: IntegerDescriptor = {
  type: 'integer',
  signed: true,
  bits: 8,
}

export const INT16: IntegerDescriptor = {
  type: 'integer',
  signed: true,
  bits: 16,
}

export const INT32: IntegerDescriptor = {
  type: 'integer',
  signed: true,
  bits: 32,
}

export function copy(view: DataView): DataView {
  const buffer = new ArrayBuffer(view.byteLength)
  const dest = new DataView(buffer)

  for (let i = 0; i < view.byteLength; i++) {
    dest.setUint8(i, view.getUint8(i))
  }

  return dest
}

export function approxByteLength(obj: any): number {
  if (obj && obj.byteLength !== undefined) {
    return obj.byteLength
  }

  if (typeof obj === 'string') {
    return obj.length * 2
  }

  if (typeof obj === 'number') {
    return 8
  }

  if (typeof obj === 'boolean') {
    return 4
  }

  if (typeof obj === 'object') {
    if (!obj) {
      return 0
    }

    if (Array.isArray(obj)) {
      return obj.map(approxByteLength).reduce((a, b) => a + b, 0)
    }

    return Object.entries(obj)
      .flatMap(entry => entry.map(approxByteLength))
      .reduce((a, b) => a + b, 0)
  }

  return 0
}

function getByteLength(descriptor: AnyDescriptor, data: any): number {
  const { type, nullable } = descriptor

  if (nullable && data === null) {
    return u8
  }

  if (type === 'char') {
    return (nullable ? u8 : 0) + descriptor.bytes
  }

  if (type === 'bool') {
    return (nullable ? u8 : 0) + u8
  }

  if (type === 'integer') {
    return (nullable ? u8 : 0) + descriptor.bits / 8
  }

  if (type === 'buffer') {
    return (nullable ? u8 : 0) + u32 + data.byteLength
  }

  if (type === 'string') {
    let byteLength = (nullable ? u8 : 0) + u32

    if (typeof data === 'string') {
      for (let i = 0, len = data.length; i < len; i++) {
        const codePoint = data.codePointAt(i)

        if (codePoint === undefined) {
          continue
        }

        if (codePoint < 0x0080) {
          byteLength += u8
        } else if (codePoint < 0x0800) {
          byteLength += u16
        } else if (codePoint < 0x10000) {
          byteLength += u8 + u16
        } else {
          byteLength += u32
        }
      }
    }

    return byteLength
  }

  if (type === 'array') {
    return (
      (nullable ? u8 : 0) +
      descriptor.size * getByteLength(descriptor.items, data[0])
    )
  }

  if (type === 'vector') {
    return (
      (nullable ? u8 : 0) +
      u32 +
      data.length * u32 +
      (data as any[])
        .map(item => getByteLength(descriptor.items, item))
        .reduce((a, b) => a + b, 0)
    )
  }

  if (type === 'struct') {
    return (
      (nullable ? u8 : 0) +
      descriptor.fields.length * u32 +
      descriptor.fields
        .map(([name, fieldDescriptor]) =>
          getByteLength(fieldDescriptor, data[name])
        )
        .reduce((a, b) => a + b, 0)
    )
  }

  if (type === 'dict') {
    const entries = Object.entries(data)

    const keysByteLength = entries
      .flatMap(([key]) => [getByteLength(descriptor.key, key), u32])
      .reduce((a, b) => a + b, 0)

    const valuesByteLength = entries
      .map(([, value]) => getByteLength(descriptor.value, value))
      .reduce((a, b) => a + b, 0)

    return (nullable ? u8 : 0) + u32 + keysByteLength + valuesByteLength
  }

  if (type === 'union') {
    const { descriptors, tagField } = descriptor
    const childDescriptor = descriptors[data[tagField]] as StructDescriptor
    return (nullable ? u8 : 0) + u8 + getByteLength(childDescriptor, data)
  }

  return 0
}

function createDataView(byteLength: number): DataView {
  return new DataView(new ArrayBuffer(byteLength))
}

function createPointerRef(offset = 0): PointerRef {
  return { offset }
}

function getInteger(
  descriptor: IntegerDescriptor,
  view: DataView,
  byteOffset: number
) {
  const { signed, bits } = descriptor
  const method = `get${signed ? 'Int' : 'Uint'}${bits}` as const
  const data = view[method](byteOffset, LITTLE_ENDIAN)
  byteOffset += bits / 8
  return data
}

function encodeInteger(
  descriptor: IntegerDescriptor,
  data: number,
  view: DataView = createDataView(getByteLength(descriptor, data)),
  pointerRef: PointerRef = createPointerRef()
) {
  const { signed, bits } = descriptor
  const method = `set${signed ? 'Int' : 'Uint'}${bits}` as const
  view[method](pointerRef.offset, data, LITTLE_ENDIAN)
  pointerRef.offset += bits / 8
  return view
}

const textDecoder = new TextDecoder()
const textEncoder = new TextEncoder()

function getChar(
  descriptor: CharDescriptor,
  view: DataView,
  byteOffset: number
) {
  const { bytes } = descriptor
  const data = textDecoder.decode(new DataView(view.buffer, byteOffset, bytes))
  byteOffset += bytes

  return data
}

function encodeChar(
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

function getString(_: StringDescriptor, view: DataView, byteOffset: number) {
  const byteLength = view.getUint32(byteOffset, LITTLE_ENDIAN)
  byteOffset += u32
  return textDecoder.decode(new DataView(view.buffer, byteOffset, byteLength))
}

function encodeString(
  descriptor: StringDescriptor,
  data: string,
  view: DataView = createDataView(getByteLength(descriptor, data)),
  pointerRef: PointerRef = createPointerRef()
) {
  const byteLength =
    getByteLength(descriptor, data) - (descriptor.nullable ? u8 : 0) - u32
  view.setUint32(pointerRef.offset, byteLength, LITTLE_ENDIAN)
  pointerRef.offset += u32

  const dest = new Uint8Array(view.buffer, pointerRef.offset)
  textEncoder.encodeInto(data, dest)
  pointerRef.offset += byteLength

  return view
}

function getBoolean(_: BooleanDescriptor, view: DataView, byteOffset: number) {
  return !!view.getUint8(byteOffset)
}

function encodeBoolean(
  descriptor: BooleanDescriptor,
  data: boolean,
  view: DataView = createDataView(getByteLength(descriptor, data)),
  pointerRef: PointerRef = createPointerRef()
) {
  view.setUint8(pointerRef.offset, data ? 1 : 0)
  pointerRef.offset += u8
  return view
}

function getBuffer(_: BufferDescriptor, view: DataView, byteOffset: number) {
  const byteLength = view.getUint32(byteOffset, LITTLE_ENDIAN)
  byteOffset += u32
  return view.buffer.slice(byteOffset, byteOffset + byteLength)
}

function encodeBuffer(
  descriptor: BufferDescriptor,
  data: ArrayBufferLike,
  view: DataView = createDataView(getByteLength(descriptor, data)),
  pointerRef: PointerRef = createPointerRef()
) {
  const byteLength = data.byteLength
  view.setUint32(pointerRef.offset, byteLength, LITTLE_ENDIAN)
  pointerRef.offset += u32

  const src = !ArrayBuffer.isView(data)
    ? new DataView(data)
    : new DataView(data, data.byteOffset, data.byteLength)

  for (let i = 0; i < byteLength; i++) {
    view.setUint8(pointerRef.offset, src.getUint8(i))
    pointerRef.offset += u8
  }

  return view
}

function getStruct(
  descriptor: StructDescriptor,
  view: DataView,
  lazy: boolean,
  byteOffset: number
) {
  const { fields } = descriptor
  const struct: any = {}
  const initialOffset = byteOffset

  for (let i = 0, len = fields.length; i < len; i++) {
    const field = fields[i]

    if (!field) {
      continue
    }

    const [key, itemDescriptor] = field

    if (lazy) {
      Object.defineProperty(struct, key, {
        enumerable: true,

        get() {
          const fieldByteOffset =
            initialOffset +
            view.getUint32(initialOffset + i * u32, LITTLE_ENDIAN)
          return getProperty(itemDescriptor, view, lazy, fieldByteOffset)
        },

        set(value: any) {
          const fieldByteOffset =
            initialOffset +
            view.getUint32(initialOffset + i * u32, LITTLE_ENDIAN)
          return setProperty(itemDescriptor, value, view, fieldByteOffset)
        },
      })
    } else {
      const fieldByteOffset =
        initialOffset + view.getUint32(byteOffset, LITTLE_ENDIAN)
      byteOffset += u32
      struct[key] = getProperty(itemDescriptor, view, lazy, fieldByteOffset)
    }
  }

  return struct
}

function encodeStruct(
  descriptor: StructDescriptor,
  data: any,
  view: DataView = createDataView(getByteLength(descriptor, data)),
  pointerRef: PointerRef = createPointerRef()
) {
  const headerByteLength = descriptor.fields.length * u32
  let fieldPointer = headerByteLength

  for (const [name, fieldDescriptor] of descriptor.fields) {
    view.setUint32(pointerRef.offset, fieldPointer, LITTLE_ENDIAN)
    fieldPointer += getByteLength(fieldDescriptor, data[name])
    pointerRef.offset += u32
  }

  for (const [name, fieldDescriptor] of descriptor.fields) {
    encodeProperty(fieldDescriptor, data[name], view, pointerRef)
  }

  return view
}

function getArray(
  descriptor: ArrayDescriptor,
  view: DataView,
  lazy: boolean,
  byteOffset: number
) {
  const { size, items } = descriptor
  const array: any[] = []

  for (let i = 0; i < size; i++) {
    array.push(getProperty(items, view, lazy, byteOffset))
    byteOffset += getByteLength(items, null)
  }

  return array
}

function encodeArray(
  descriptor: ArrayDescriptor,
  data: any[],
  view: DataView = createDataView(getByteLength(descriptor, data)),
  pointerRef: PointerRef = createPointerRef()
) {
  for (let i = 0; i < descriptor.size; i++) {
    encodeProperty(descriptor.items, data[i], view, pointerRef)
  }

  return view
}

function getVector(
  descriptor: VectorDescriptor,
  view: DataView,
  lazy: boolean,
  byteOffset: number
) {
  const initialOffset = byteOffset

  const size = view.getUint32(byteOffset, LITTLE_ENDIAN)
  byteOffset += u32

  const vector: any[] = []

  for (let i = 0; i < size; i++) {
    const valueByteOffset =
      initialOffset + view.getUint32(byteOffset, LITTLE_ENDIAN)
    byteOffset += u32
    vector.push(getProperty(descriptor.items, view, lazy, valueByteOffset))
  }

  return vector
}

function encodeVector(
  descriptor: VectorDescriptor,
  data: any[],
  view: DataView = createDataView(getByteLength(descriptor, data)),
  pointerRef: PointerRef = createPointerRef()
) {
  const size = data.length
  const headerByteLength = u32 + size * u32

  view.setUint32(pointerRef.offset, size, LITTLE_ENDIAN)
  pointerRef.offset += u32

  let itemPointer = headerByteLength

  for (const item of data) {
    view.setUint32(pointerRef.offset, itemPointer, LITTLE_ENDIAN)
    itemPointer += getByteLength(descriptor.items, item)
    pointerRef.offset += u32
  }

  for (const item of data) {
    encodeProperty(descriptor.items, item, view, pointerRef)
  }

  return view
}

function getDict(
  descriptor: DictDescriptor,
  view: DataView,
  lazy: boolean,
  byteOffset: number
) {
  const initialOffset = byteOffset
  const size = view.getUint32(byteOffset, LITTLE_ENDIAN)
  byteOffset += u32

  const keys: Array<[string, number]> = []

  for (let i = 0; i < size; i++) {
    const key = getProperty(descriptor.key, view, lazy, byteOffset)
    const keyByteLength = getByteLength(descriptor.key, key)
    byteOffset += keyByteLength

    const valueOffset = view.getUint32(byteOffset, LITTLE_ENDIAN)
    byteOffset += u32

    keys.push([key, valueOffset])
  }

  const dict: any = {}

  for (const [key, valueOffset] of keys) {
    const valueByteOffset = initialOffset + valueOffset

    if (lazy) {
      Object.defineProperty(dict, key, {
        enumerable: true,
        get() {
          return getProperty(descriptor.value, view, lazy, valueByteOffset)
        },
      })
    } else {
      dict[key] = getProperty(descriptor.value, view, lazy, valueByteOffset)
    }
  }

  return dict
}

function encodeDict(
  descriptor: DictDescriptor,
  data: any,
  view: DataView = createDataView(getByteLength(descriptor, data)),
  pointerRef: PointerRef = createPointerRef()
) {
  const entries = Object.entries(data)
  view.setUint32(pointerRef.offset, entries.length, LITTLE_ENDIAN)
  pointerRef.offset += u32

  const headerByteLength = entries.reduce((acc, [key]) => {
    return acc + getByteLength(descriptor.key, key) + u32
  }, u32)

  let offsetPointer = headerByteLength

  for (const [key, value] of entries) {
    encodeProperty(descriptor.key, key, view, pointerRef)
    view.setUint32(pointerRef.offset, offsetPointer, LITTLE_ENDIAN)
    pointerRef.offset += u32
    offsetPointer += getByteLength(descriptor.value, value)
  }

  for (const [, value] of entries) {
    encodeProperty(descriptor.value, value, view, pointerRef)
  }

  return view
}

function getUnion(
  descriptor: UnionDescriptor,
  view: DataView,
  lazy: boolean,
  byteOffset: number
) {
  const { descriptors } = descriptor

  const tag = view.getUint8(byteOffset)
  byteOffset += u8

  const value: any = getProperty(
    descriptors[tag] as StructDescriptor,
    view,
    lazy,
    byteOffset
  )

  return value
}

function encodeUnion(
  descriptor: UnionDescriptor,
  data: any,
  view: DataView = createDataView(getByteLength(descriptor, data)),
  pointerRef: PointerRef = createPointerRef()
) {
  const { tagField, descriptors } = descriptor

  const tag = data[tagField]
  view.setUint8(pointerRef.offset, tag)
  pointerRef.offset += u8

  encodeStruct(descriptors[tag] as StructDescriptor, data, view, pointerRef)

  return view
}

export function getProperty(
  descriptor: AnyDescriptor,
  view: DataView,
  lazy: boolean = true,
  byteOffset: number = 0
) {
  if (descriptor.nullable) {
    const isNull = view.getUint8(byteOffset) === 0
    byteOffset += u8

    if (isNull) {
      return null
    }
  }

  switch (descriptor.type) {
    case 'integer':
      return getInteger(descriptor, view, byteOffset)

    case 'char':
      return getChar(descriptor, view, byteOffset)

    case 'string':
      return getString(descriptor, view, byteOffset)

    case 'bool':
      return getBoolean(descriptor, view, byteOffset)

    case 'buffer':
      return getBuffer(descriptor, view, byteOffset)

    case 'struct':
      return getStruct(descriptor, view, lazy, byteOffset)

    case 'vector':
      return getVector(descriptor, view, lazy, byteOffset)

    case 'array':
      return getArray(descriptor, view, lazy, byteOffset)

    case 'dict':
      return getDict(descriptor, view, lazy, byteOffset)

    case 'union':
      return getUnion(descriptor, view, lazy, byteOffset)
  }
}

export function setProperty(
  descriptor: AnyDescriptor,
  data: any,
  view: DataView,
  byteOffset: number
): void {
  if (descriptor.nullable) {
    throw new Error('Encoding error: cannot overwrite nullable property')
  }

  switch (descriptor.type) {
    case 'integer':
      encodeProperty(descriptor, data, view, createPointerRef(byteOffset))
      break

    case 'char':
      encodeChar(descriptor, data, view, createPointerRef(byteOffset))
      break

    case 'bool':
      encodeBoolean(descriptor, data, view, createPointerRef(byteOffset))
      break

    case 'array':
      encodeArray(descriptor, data, view, createPointerRef(byteOffset))
      break

    default:
      throw new Error(
        'Encoding error: cannot overwrite variable-length property'
      )
  }
}

export function encodeProperty(
  descriptor: AnyDescriptor,
  data: any,
  view: DataView = createDataView(getByteLength(descriptor, data)),
  pointerRef: PointerRef = createPointerRef()
) {
  if (descriptor.nullable) {
    view.setUint8(pointerRef.offset, data === null ? 0 : 1)
    pointerRef.offset += u8

    if (data === null) {
      return view
    }
  }

  switch (descriptor.type) {
    case 'integer':
      encodeInteger(descriptor, data, view, pointerRef)
      break

    case 'char':
      encodeChar(descriptor, data, view, pointerRef)
      break

    case 'string':
      encodeString(descriptor, data, view, pointerRef)
      break

    case 'bool':
      encodeBoolean(descriptor, data, view, pointerRef)
      break

    case 'buffer':
      encodeBuffer(descriptor, data, view, pointerRef)
      break

    case 'struct':
      encodeStruct(descriptor, data, view, pointerRef)
      break

    case 'vector':
      encodeVector(descriptor, data, view, pointerRef)
      break

    case 'array':
      encodeArray(descriptor, data, view, pointerRef)
      break

    case 'dict':
      encodeDict(descriptor, data, view, pointerRef)
      break

    case 'union':
      encodeUnion(descriptor, data, view, pointerRef)
      break
  }

  return view
}

export interface Lens {
  __repro_IS_VIEW_LENS: true
  __repro_DATAVIEW: DataView
}

export function isLens(data: any): data is Lens {
  return data.__repro_IS_VIEW_LENS === true
}

export function unwrapLens(data: Lens) {
  return data.__repro_DATAVIEW
}

export interface View<T, D extends AnyDescriptor> {
  readonly descriptor: D
  readonly schema: ZodType<Partial<T>, ZodTypeDef, T>

  validate(data: T): T
  encode(data: T | (T & Lens), options?: { validate: boolean }): DataView
  decode(view: DataView | T | (T & Lens)): T
  from(data: T, options?: { validate: boolean }): T
  over(data: DataView): T & Lens

  nullable(): View<T | null, D & { nullable: true }>
}

export function createView<T, D extends AnyDescriptor>(
  descriptor: D,
  schema: ZodType<T, ZodTypeDef>
): View<T, D> {
  const LAZY = true

  function validate(data: T) {
    return schema.parse(data)
  }

  function encode(
    data: T | (T & Lens),
    options = { validate: false }
  ): DataView {
    if (isLens(data)) {
      // TODO: validate dataview bytecode/checksum/etc
      return unwrapLens(data)
    }

    if (options.validate) {
      validate(data)
    }

    return encodeProperty(descriptor, data)
  }

  function decode(view: DataView | T | (T & Lens)): T {
    let dataView: DataView

    if (isLens(view)) {
      dataView = unwrapLens(view)
    } else if (ArrayBuffer.isView(view)) {
      dataView = view
    } else {
      // No-op if view is already decoded
      return view
    }

    return getProperty(descriptor, dataView, !LAZY) as unknown as T
  }

  function from(data: T, options = { validate: false }): T {
    if (options.validate) {
      validate(data)
    }

    return over(encode(data))
  }

  function over(view: DataView): T & Lens {
    // TODO: validate dataview bytecode/checksum/etc
    const data = getProperty(descriptor, view, LAZY) as unknown as T & Lens

    Object.defineProperty(data, '__repro_IS_VIEW_LENS', {
      value: true,
    })

    Object.defineProperty(data, '__repro_DATAVIEW', {
      value: view,
    })

    return data
  }

  function nullable(): View<T | null, D & { nullable: true }> {
    return createView({ ...descriptor, nullable: true }, schema.nullable())
  }

  return {
    // Metadata
    descriptor,
    schema,

    // Operations
    decode,
    encode,
    from,
    over,
    validate,

    // Transforms
    nullable,
  }
}
