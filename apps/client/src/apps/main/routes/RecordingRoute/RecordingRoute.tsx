import { fork, FutureInstance } from 'fluture'
import { Block, Grid } from 'jsxstyle'
import React, { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Card } from '~/components/Card'
import { useApiClient } from '~/libs/api'
import {
  createApiSource,
  createNullSource,
  PlaybackFromSourceProvider,
} from '~/libs/playback'
import { DevTools } from './DevTools'
import { Loading } from './Loading'
import { RecordingError } from './RecordingError'
import { Sidebar } from './Sidebar'

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

function useFuture<L, R>(
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

export const RecordingRoute: React.FC = () => {
  const params = useParams<'recordingId'>()
  const recordingId = params.recordingId
  const apiClient = useApiClient()

  const {
    loading,
    error,
    result: metadata,
  } = useFuture(() => {
    return apiClient.recording.getRecordingMetadata(recordingId!)
  }, [apiClient, recordingId])

  const [source, setSource] = useState(createNullSource())

  useEffect(() => {
    if (recordingId && !loading && !error) {
      setSource(createApiSource(recordingId, apiClient))
    }
  }, [error, loading, recordingId, apiClient, setSource])

  useEffect(() => {
    const originalTitle = document.title

    if (metadata) {
      document.title = `${metadata.title} - Repro`
    }

    return () => {
      document.title = originalTitle
    }
  }, [metadata])

  if (loading) {
    return <Loading />
  }

  if (error) {
    return <RecordingError error={error} />
  }

  return (
    <PlaybackFromSourceProvider source={source}>
      <Grid
        gap={15}
        height="calc(100vh - 90px)"
        gridTemplateColumns="1fr 4fr"
        gridTemplateRows="100%"
      >
        <Sidebar metadata={metadata} />

        <Card fullBleed height="100%">
          <Block height="100%" overflow="hidden" borderRadius={4}>
            <DevTools />
          </Block>
        </Card>
      </Grid>
    </PlaybackFromSourceProvider>
  )
}
