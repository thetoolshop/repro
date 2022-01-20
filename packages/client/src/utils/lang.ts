export const copyArray = <T>(arr: Array<T>) => arr.slice()
export const copyObject = <T extends object>(obj: T): T => ({ ...obj })
export const copyObjectDeep = <T extends object>(obj: T): T =>
  JSON.parse(JSON.stringify(obj))

export class ArrayBufferBackedList<T> {
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

  shift(): T | null {
    const buf = this.source.shift()
    return buf ? this.reader(buf) : null
  }

  unshift(...entries: Array<T>): number {
    return this.source.unshift(...entries.map(this.writer))
  }

  pop(): T | null {
    const buf = this.source.pop()
    return buf ? this.reader(buf) : null
  }

  push(...entries: Array<T>): number {
    return this.source.push(...entries.map(this.writer))
  }

  *[Symbol.iterator]() {
    for (const entry of this.source) {
      yield this.reader(entry)
    }
  }
}
