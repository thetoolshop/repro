export const copyArray = <T>(arr: Array<T>) => arr.slice()
export const copyObject = <T extends object>(obj: T): T => ({ ...obj })
export const copyObjectDeep = <T extends object>(obj: T): T =>
  JSON.parse(JSON.stringify(obj))

function noopReader<T>() {
  return (_buf: ArrayBuffer) => undefined as unknown as T
}

function noopWriter<T>() {
  return (_entry: T) => undefined as unknown as ArrayBuffer
}

export class ArrayBufferBackedList<T> {
  static NoOp<T>(): ArrayBufferBackedList<T> {
    return new ArrayBufferBackedList([], noopReader<T>(), noopWriter<T>())
  }

  constructor(
    private readonly source: Array<ArrayBuffer>,
    private readonly reader: (buf: ArrayBuffer) => T,
    private readonly writer: (entry: T) => ArrayBuffer
  ) {}

  size(): number {
    return this.source.length
  }

  at(index: number): ArrayBuffer | null {
    return this.source[index] || null
  }

  delete(index: number): void {
    this.source.splice(index, 1)
  }

  read(index: number): T | null {
    const entry = this.at(index)
    return entry ? this.reader(entry) : null
  }

  slice(start?: number, end?: number): ArrayBufferBackedList<T> {
    return new ArrayBufferBackedList(
      this.source.slice(start, end),
      this.reader,
      this.writer
    )
  }

  prepend(...entries: Array<T>): number {
    return this.source.unshift(...entries.map(this.writer))
  }

  append(...entries: Array<T>): number {
    return this.source.push(...entries.map(this.writer))
  }

  *[Symbol.iterator]() {
    for (const entry of this.source) {
      yield this.reader(entry)
    }
  }
}
