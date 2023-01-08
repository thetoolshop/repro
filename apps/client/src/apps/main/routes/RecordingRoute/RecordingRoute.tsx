import { fork, FutureInstance } from 'fluture'
import { Block, Grid } from 'jsxstyle'
import React, { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Card } from '~/components/Card'
import { DefinitionList } from '~/components/DefinitionList/DefinitionList'
import { colors } from '~/config/theme'
import { useApiClient } from '~/libs/api'
import {
  createApiSource,
  createNullSource,
  PlaybackFromSourceProvider,
} from '~/libs/playback'
import { ucfirst } from '~/utils/string'
import { DevTools } from './DevTools'
import { EventHighlights } from './EventHighlights'

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
            gridTemplateRows="auto 1fr auto"
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

              <Block
                marginTop={10}
                fontSize={13}
                textDecoration="underline"
                lineHeight={1.25}
                color={colors.blue['500']}
              >
                {metadata.url}
              </Block>

              <Block
                marginTop={10}
                lineHeight={1.5}
                fontSize={13}
                emptyDisplay="none"
              >
                {metadata.description}
              </Block>
            </Block>

            <Block backgroundColor={colors.slate['50']}>
              <EventHighlights />
            </Block>

            <Grid
              isolation="isolate"
              paddingH={10}
              gridTemplateColumns="max-content 1fr"
              fontSize={13}
              backgroundColor={colors.white}
              borderTop={`1px solid ${colors.slate['200']}`}
              boxShadow={`0 -4px 16px ${colors.slate['100']}`}
            >
              <DefinitionList
                title="Details"
                pairs={[
                  ['Posted by', metadata.authorName],
                  ['Created at', formatDate(metadata.createdAt)],
                  [
                    'Browser',
                    metadata.browserName
                      ? `${ucfirst(metadata.browserName)} ${
                          metadata.browserVersion
                        }`
                      : null,
                  ],
                  ['OS', metadata.operatingSystem],
                ]}
              />
            </Grid>
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
