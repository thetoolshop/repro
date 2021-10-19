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
      emit(`(sample [${record.entries}]) ${label}`, record.total / record.entries)
      delete samples[label] 
    }

    sampling = false
  })
}

function emit<T>(label: string, value: T) {
  console.debug(label, value)
}

export const Stats = {
  enable() {
    enabled = true
  },

  disable() {
    enabled = false
  },

  // TODO: support anonymised reporting
  scalar<T extends number>(label: string, value: FactoryOrValue<T>) {
    if (enabled) {
      emit(label, typeof value === 'function' ? value() : value)
    }
  },

  sample<T extends number>(label: string, value: FactoryOrValue<T>) {
    if (enabled) {
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
  }
}
