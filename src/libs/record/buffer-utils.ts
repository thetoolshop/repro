import { copyObjectDeep } from '@/utils/lang'
import { Stats } from '../diagnostics'
import { Subscriber } from './types'

export type Unsubscribe = () => void

export interface Buffer<T> {
  clear(): void
  copy(): Array<T>
  peek(): T | null
  push(entry: T): void
  onEvict(subscriber: Subscriber<Array<T>>): Unsubscribe
}

export function createBuffer<T>(maxSizeInBytes: number): Buffer<T> {
  const buffer: Array<T> = []
  let size = 0

  let evicting = false
  const subscribers = new Set<Subscriber<Array<T>>>()

  function scheduleEvictions() {
    evicting = true

    requestIdleCallback(() => {
      const start = performance.now()
      const evicted: Array<T> = []

      while (size > maxSizeInBytes) {
        const entry = buffer.shift()

        if (entry) {
          size -= approxByteLength(entry)
          evicted.push(entry)
        }
      }

      Stats.value('Buffer: calculating evictions', performance.now() - start)

      if (evicted.length) {
        for (const subscriber of subscribers) {
          subscriber(evicted)
        }

        Stats.value('Buffer: evicted entries', evicted.length)
      }

      evicting = false
    })
  }

  return {
    /**
     * Empty buffer.
     */
    clear() {
      while (buffer.length) {
        buffer.shift()
      }

      size = 0
    },

    /**
     * Create deep copy of current buffer.
     */
    copy() {
      return copyObjectDeep(buffer)
    },

    /**
     * Read oldest entry from buffer, or null if empty.
     */
    peek() {
      return buffer[0] || null
    },

    /**
     * Append new entry to buffer.
     */
    push(entry) {
      const start = performance.now()

      buffer.push(entry)
      size += approxByteLength(entry)

      if (!evicting) {
        scheduleEvictions()
      }

      Stats.mean('Buffer: push entry', performance.now() - start)
    },

    onEvict(subscriber) {
      subscribers.add(subscriber)
      return () => subscribers.delete(subscriber)
    }
  }
}

export function approxByteLength(obj: any): number {
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
      return obj
        .map(approxByteLength)
        .reduce((a, b) => a + b, 0)
    }

    return Object.entries(obj)
      .flatMap(entry => entry.map(approxByteLength))
      .reduce((a, b) => a + b, 0)
  }

  return 0
}
