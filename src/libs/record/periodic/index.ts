import { ObserverLike } from '@/utils/observer'

export function observePeriodic(
  period: number,
  callback: () => void
): ObserverLike {
  let handle: number

  return {
    disconnect() {
      clearInterval(handle)
    },

    observe() {
      handle = window.setInterval(callback, period)
    },
  }
}
