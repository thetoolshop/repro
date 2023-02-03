import { FutureInstance, fork } from 'fluture'
import { useEffect, useRef, useState } from 'react'

interface ResolvedFuture<R> {
  success: true
  loading: false
  error: null
  result: R
}

interface RejectedFuture<L> {
  success: false
  loading: false
  error: L
  result: null
}

interface PendingFuture {
  success: false
  loading: true
  error: null
  result: null
}

type FutureResult<L, R> = PendingFuture | ResolvedFuture<R> | RejectedFuture<L>

export function useFuture<L, R>(
  factory: () => FutureInstance<L, R>,
  deps: Array<any>
): FutureResult<L, R> {
  const initialized = useRef(false)
  const [future, setFuture] = useState(factory)

  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState<R | null>(null)
  const [error, setError] = useState<L | null>(null)

  useEffect(() => {
    if (initialized.current) {
      setFuture(factory())
    }
  }, [initialized, setFuture, ...deps])

  useEffect(() => {
    initialized.current = true

    setError(null)
    setResult(null)
    setLoading(true)

    return future.pipe(
      fork<L>(err => {
        setError(err)
        setLoading(false)
      })<R>(res => {
        setResult(res)
        setLoading(false)
      })
    )
  }, [future, setError, setLoading, setResult])

  return {
    success: !loading && !!result,
    loading,
    error,
    result,
  } as FutureResult<L, R>
}
