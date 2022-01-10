import { copyArray } from '@/utils/lang'
import { Stats } from '../diagnostics'
import { Subscriber } from './types'

export type Unsubscribe = () => void

export interface Buffer<T> {
  clear(): void
  copy(): Array<T>
  peek(): T | null
  push(entry: T): void
  onEvict(subscriber: Subscriber<Array<T>>): Unsubscribe
  onPush(subscriber: Subscriber<T>): Unsubscribe
}

export function createBuffer<T>(maxSizeInBytes: number): Buffer<T> {
  const buffer: Array<T> = []
  let size = 0

  let evicting = false

  const subscribers = {
    onEvict: new Set<Subscriber<Array<T>>>(),
    onPush: new Set<Subscriber<T>>(),
  }

  function scheduleEvictions() {
    evicting = true

    requestIdleCallback(() => {
      const evicted: Array<T> = []

      while (size > maxSizeInBytes) {
        const entry = buffer.shift()

        if (entry) {
          size -= approxByteLength(entry)
          evicted.push(entry)
        }
      }

      if (evicted.length) {
        for (const subscriber of subscribers.onEvict) {
          subscriber(evicted)
        }
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
     * Create shallow copy of current buffer.
     */
    copy() {
      return copyArray(buffer)
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
      buffer.push(entry)

      for (const subscriber of subscribers.onPush) {
        subscriber(entry)
      }

      size += approxByteLength(entry)

      if (!evicting) {
        scheduleEvictions()
      }
    },

    onEvict(subscriber) {
      subscribers.onEvict.add(subscriber)
      return () => subscribers.onEvict.delete(subscriber)
    },

    onPush(subscriber) {
      subscribers.onPush.add(subscriber)
      return () => subscribers.onPush.delete(subscriber)
    },
  }
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
