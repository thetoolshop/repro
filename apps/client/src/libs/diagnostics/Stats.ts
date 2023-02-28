import { logger } from '@repro/logger'

let enabled = false

type FactoryOrValue<T> = T | (() => T)

interface SampleRecord {
  total: number
  entries: number
}

function createEmptySampleRecord(): SampleRecord {
  return {
    total: 0,
    entries: 0,
  }
}

let sampling = false

const samples: Record<string, SampleRecord> = {}

function awaitSample() {
  requestIdleCallback(() => {
    for (const [label, record] of Object.entries(samples)) {
      emit(
        `(sample [${record.entries}]) ${label}`,
        record.total / record.entries
      )
      delete samples[label]
    }

    sampling = false
  })
}

function emit<T>(label: string, value: T) {
  logger.debug(label, value)
}

type AnyFunction = (...args: any[]) => any

export const Stats = {
  enable() {
    enabled = true
  },

  disable() {
    enabled = false
  },

  value(label: string, value: FactoryOrValue<number>) {
    if (enabled) {
      emit(`(value) ${label}`, typeof value === 'function' ? value() : value)
    }
  },

  mean(label: string, value: FactoryOrValue<number>) {
    if (enabled) {
      label = `(mean) ${label}`
      let record = samples[label]

      if (!record) {
        record = createEmptySampleRecord()
        samples[label] = record
      }

      record.total += typeof value === 'function' ? value() : value
      record.entries += 1

      if (!sampling) {
        sampling = true
        awaitSample()
      }
    }
  },

  time<T extends AnyFunction>(label: string, fn: T): ReturnType<T> {
    if (!enabled) {
      return fn()
    }

    const start = performance.now()
    const result = fn()
    emit(`(time) ${label}`, performance.now() - start)
    return result
  },
}
