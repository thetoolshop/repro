export function stress(fn: () => void) {
  // const iterations = 10_000
  const iterations = 1
  const start = performance.now()

  for (let i = 0; i < iterations; i++) {
    fn()
  }

  return 1000 / ((performance.now() - start) / iterations)
}
