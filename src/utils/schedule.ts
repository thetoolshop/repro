const resolvedPromise = Promise.resolve()

export function scheduleMicrotask(callback: () => void) {
  return resolvedPromise.then(() => callback())
}
