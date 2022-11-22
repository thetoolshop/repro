import { RecordingMetadata } from '@repro/domain'
import { fork, FutureInstance } from 'fluture'
import { Block, Grid, InlineBlock, Row } from 'jsxstyle'
import React, { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Card } from '~/components/Card'
import { colors } from '~/config/theme'
import { useApiClient } from '~/libs/api'
import {
  createApiSource,
  createNullSource,
  PlaybackFromSourceProvider,
} from '~/libs/playback'
import { DevTools } from './DevTools'

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

function formatDate(isoDate: string): string {
  return new Intl.DateTimeFormat([...navigator.languages], {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(Date.parse(isoDate))
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
    if (recordingId) {
      setSource(createApiSource(recordingId, apiClient))
    }
  }, [recordingId, apiClient, setSource])

  if (loading) {
    return <div />
  }

  if (error) {
    return <div />
  }

  return (
    <PlaybackFromSourceProvider source={source}>
      <Grid
        gap={15}
        height="calc(100vh - 80px)"
        gridTemplateColumns="1fr 4fr"
        gridTemplateRows="100%"
      >
        <Card>
          <Grid
            gridTemplateRows="auto 1fr"
            height="100%"
            marginH={-20}
            overflow="hidden"
          >
            <Block
              isolation="isolate"
              paddingH={20}
              paddingBottom={20}
              boxShadow={`0 4px 16px ${colors.slate['200']}`}
              borderBottom={`1px solid ${colors.slate['200']}`}
            >
              <Block fontSize={20} lineHeight={1.25}>
                {metadata.title}
              </Block>

              <Row
                paddingTop={10}
                marginTop={10}
                gap={5}
                fontSize={11}
                lineHeight={1}
                borderTop={`1px solid ${colors.slate['200']}`}
                color={colors.slate['700']}
              >
                <InlineBlock fontWeight={700}>
                  {metadata.authorName}
                </InlineBlock>
                <InlineBlock>
                  posted {formatDate(metadata.createdAt)}
                </InlineBlock>
              </Row>

              <Block marginTop={10} lineHeight={1.5} fontSize={13}>
                {metadata.description}
              </Block>
            </Block>

            <Block
              overflowY="auto"
              backgroundColor={colors.slate['50']}
              backgroundImage={`linear-gradient(to bottom, ${colors.slate['50']}, ${colors.white})`}
            ></Block>
          </Grid>
        </Card>

        <Card fullBleed height="100%">
          <Block height="100%" overflow="hidden" borderRadius={4}>
            <DevTools />
          </Block>
        </Card>
      </Grid>
    </PlaybackFromSourceProvider>
  )
}
