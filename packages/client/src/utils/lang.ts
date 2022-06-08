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
  static Empty<T>(): LazyList<T> {
    return new LazyList([], noopDecoder<T>(), noopEncoder<T>())
  }

  constructor(
    private readonly source: Array<DataView>,
    private readonly decoder: (view: DataView) => T,
    private readonly encoder: (entry: T) => DataView
  ) {}

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

  *[Symbol.iterator]() {
    for (const entry of this.source) {
      yield this.decoder(entry)
    }
  }
}
