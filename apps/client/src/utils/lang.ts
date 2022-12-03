export const copyArray = <T>(arr: Array<T>) => arr.slice()
export const copyObject = <T extends object>(obj: T): T => ({ ...obj })
export const copyObjectDeep = <T extends object>(obj: T): T =>
  JSON.parse(JSON.stringify(obj))

function noopDecoder<T>() {
  return (_view: DataView) => undefined as unknown as T
}

function noopEncoder<T>() {
  return (_entry: T) => undefined as unknown as DataView
}

export class LazyList<T> {
  private readonly source: Array<DataView>

  static Empty<T>(
    decoder = noopDecoder<T>(),
    encoder = noopEncoder<T>()
  ): LazyList<T> {
    return new LazyList([], decoder, encoder)
  }

  constructor(
    source: Array<DataView> | Array<T>,
    private readonly decoder: (view: DataView) => T,
    private readonly encoder: (entry: T) => DataView
  ) {
    const entry = source[0]

    if (entry === undefined) {
      this.source = source as Array<DataView>
    } else if (ArrayBuffer.isView(entry)) {
      this.source = source as Array<DataView>
    } else {
      this.source = (source as Array<T>).map(encoder)
    }
  }

  size(): number {
    return this.source.length
  }

  at(index: number): DataView | null {
    return this.source[index] || null
  }

  delete(index: number): void {
    this.source.splice(index, 1)
  }

  decode(index: number): T | null {
    const entry = this.at(index)
    return entry ? this.decoder(entry) : null
  }

  slice(start?: number, end?: number): LazyList<T> {
    return new LazyList(
      this.source.slice(start, end),
      this.decoder,
      this.encoder
    )
  }

  prepend(...entries: Array<T>): number {
    return this.source.unshift(...entries.map(this.encoder))
  }

  append(...entries: Array<T>): number {
    return this.source.push(...entries.map(this.encoder))
  }

  toSource(): Array<DataView> {
    return this.source
  }

  *[Symbol.iterator]() {
    for (const entry of this.source) {
      yield this.decoder(entry)
    }
  }
}
