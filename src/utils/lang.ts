export const copyArray = <T>(arr: Array<T>) => arr.slice()
export const copyObject = <T extends object>(obj: T): T => ({ ...obj })
export const copyObjectDeep = <T extends object>(obj: T): T =>
  JSON.parse(JSON.stringify(obj))

export interface List<T> extends Iterable<T> {
  size(): number
  get(index: number): T | null
  slice(start?: number, end?: number): List<T>
  shift(): T | null
  unshift(...entries: Array<T>): number
  pop(): T | null
  push(...entries: Array<T>): number
}

export function createEmptyList<T>(): List<T> {
  return {
    size() {
      return 0
    },

    get() {
      return null
    },

    slice() {
      return createEmptyList<T>()
    },

    shift() {
      return null
    },

    unshift() {
      return 0
    },

    pop() {
      return null
    },

    push() {
      return 0
    },

    [Symbol.iterator]: Array.prototype[Symbol.iterator],
  }
}

export class ArrayBufferBackedList<T> implements List<T> {
  constructor(
    private readonly source: Array<ArrayBuffer>,
    private readonly read: (buf: ArrayBuffer) => T,
    private readonly write: (entry: T) => ArrayBuffer
  ) {}

  size(): number {
    return this.source.length
  }

  get(index: number): T | null {
    const entry = this.source[index] || null
    return entry ? this.read(entry) : null
  }

  slice(start?: number, end?: number): ArrayBufferBackedList<T> {
    return new ArrayBufferBackedList(
      this.source.slice(start, end),
      this.read,
      this.write
    )
  }

  shift(): T | null {
    const buf = this.source.shift()
    return buf ? this.read(buf) : null
  }

  unshift(...entries: Array<T>): number {
    return this.source.unshift(...entries.map(this.write))
  }

  pop(): T | null {
    const buf = this.source.pop()
    return buf ? this.read(buf) : null
  }

  push(...entries: Array<T>): number {
    return this.source.push(...entries.map(this.write))
  }

  *[Symbol.iterator]() {
    for (const entry of this.source) {
      yield this.read(entry)
    }
  }
}
