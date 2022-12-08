import { ZodType, ZodTypeDef } from 'zod'
import { AnyDescriptor, encodeProperty, getProperty } from './codecs/any'

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
  nullable(): View<T | null, D & { nullable: true }>
  over(data: DataView): T & Lens

  serialize(data: T | (T & Lens)): string
  deserialize(input: string): T
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

  function serialize(data: T | (T & Lens)): string {
    const view = encode(data)
    const byteArray = new Uint8Array(
      view.buffer,
      view.byteOffset,
      view.byteLength
    )

    let output = ''

    for (const byte of byteArray) {
      output += String.fromCharCode(byte)
    }

    return btoa(output)
  }

  function deserialize(input: string): T {
    const decodedInput = atob(input)
    const buffer = new ArrayBuffer(decodedInput.length)
    const view = new DataView(buffer)
    let offset = 0

    for (const char of decodedInput) {
      view.setUint8(offset, char.charCodeAt(0))
      offset += 1
    }

    return over(view)
  }

  return {
    descriptor,
    schema,

    decode,
    encode,
    from,
    nullable,
    over,
    validate,

    serialize,
    deserialize,
  }
}
