import { ObserverLike } from '../types'

export function observePeriodic(period: number, callback: () => void): ObserverLike {
  const handle = setInterval(callback, period)

  return {
    disconnect() {
      clearInterval(handle)
    }
  }
}
