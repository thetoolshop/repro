import { attemptP, FutureInstance } from 'fluture'

export function attemptQuery<R>(
  fn: () => Promise<R>
): FutureInstance<Error, R> {
  return attemptP<Error, R>(fn)
}
