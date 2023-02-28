export function scheduleIdleCallback(
  callback: () => void,
  timeout: number = 1_000
) {
  return requestIdleCallback(callback, { timeout })
}
