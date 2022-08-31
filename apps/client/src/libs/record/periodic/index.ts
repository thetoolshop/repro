import { ObserverLike } from '~/utils/observer'

export function observePeriodic(
  period: number,
  callback: () => void
): ObserverLike {
  let handle: number | null = null

  return {
    disconnect() {
      if (handle !== null) {
        clearInterval(handle)
      }
    },

    observe() {
      // Make `observe` idempotent. To be investigated whether this is "correct".
      if (handle === null) {
        handle = window.setInterval(callback, period)
      }
    },
  }
}
