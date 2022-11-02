const resolvedPromise = Promise.resolve()

export function scheduleMicrotask(callback: () => void) {
  return resolvedPromise.then(() => callback())
}

export function scheduleIdleCallback(
  callback: () => void,
  timeout: number = 1_000
) {
  return requestIdleCallback(callback, { timeout })
}
