import { ZodNullable, ZodTypeAny } from 'zod'
import { decodeProperty, decodePropertyLazy } from './decoders'
import { AnyDescriptor } from './descriptors'
import { encodeProperty } from './encoders'

export interface Lens {
  __repro_IS_VIEW_LENS: true
  __repro_DATAVIEW: DataView
}

export function isLens(data: any): data is Lens {
  return (
    data !== undefined && data !== null && data.__repro_IS_VIEW_LENS === true
  )
}

export function unwrapLens(data: Lens) {
  return data.__repro_DATAVIEW
}

export interface View<
  S extends ZodTypeAny,
  D extends AnyDescriptor,
  T = S['_output']
> {
  readonly descriptor: D
  readonly schema: S

  validate(data: T): T
  encode(data: T | (T & Lens), options?: { validate: boolean }): DataView
  decode(view: DataView | T | (T & Lens)): T
  from(data: T, options?: { validate: boolean }): T
  over(data: DataView): T & Lens

  nullable(): View<ZodNullable<S>, D & { nullable: true }, T | null>
}

export function createView<
  S extends ZodTypeAny,
  D extends AnyDescriptor,
  T = S['_output']
>(descriptor: D, schema: S): View<S, D, T> {
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

    return decodeProperty(descriptor, dataView) as unknown as T
  }

  function from(data: T, options = { validate: false }): T {
    if (options.validate) {
      validate(data)
    }

    return over(encode(data))
  }

  function over(view: DataView): T & Lens {
    // TODO: validate dataview bytecode/checksum/etc
    const data = decodePropertyLazy(descriptor, view) as unknown as T & Lens

    // Primitive types will have been fully decoded.
    // Calling `over` on them is equivalent to calling `decode`.
    if (data !== null && typeof data === 'object') {
      Object.defineProperty(data, '__repro_IS_VIEW_LENS', {
        value: true,
      })

      Object.defineProperty(data, '__repro_DATAVIEW', {
        value: view,
      })
    }

    return data
  }

  function nullable(): View<ZodNullable<S>, D & { nullable: true }, T | null> {
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
