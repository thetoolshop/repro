import { fork, FutureInstance } from 'fluture'
import { Block, Col, Grid, Row } from 'jsxstyle'
import { AlertTriangle as AlertIcon, Loader as LoaderIcon } from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'
import { NavLink, useParams } from 'react-router-dom'
import { Card } from '~/components/Card'
import { DefinitionList } from '~/components/DefinitionList/DefinitionList'
import * as FX from '~/components/FX'
import { colors } from '~/config/theme'
import { useApiClient } from '~/libs/api'
import { IfSession, UnlessSession } from '~/libs/auth/Session'
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
    return (
      <Grid
        height="calc(100vh - 90px)"
        alignItems="center"
        justifyItems="center"
      >
        <FX.Spin>
          <LoaderIcon />
        </FX.Spin>
      </Grid>
    )
  }

  if (error) {
    return (
      <Grid
        height="calc(100vh - 90px)"
        gridTemplateColumns="1fr"
        gridTemplateRows="100%"
        marginH={-15}
        backgroundColor={colors.slate['50']}
      >
        <Row alignItems="center" justifyContent="center" height="100%">
          <Card>
            <Row gap={15}>
              <AlertIcon size={48} color={colors.slate['300']} />

              <Col gap={15}>
                <Block
                  fontSize={18}
                  fontWeight={700}
                  color={
                    error.name === 'ServerName'
                      ? colors.rose['700']
                      : colors.blue['700']
                  }
                >
                  {error.name === 'ServerError'
                    ? 'Something went wrong'
                    : 'Could not find recording'}
                </Block>

                <Block fontSize={15} color={colors.slate['700']}>
                  {error.name === 'ServerError'
                    ? 'There was an error loading this recording. Please try again.'
                    : 'This recording does not exist.'}
                </Block>

                <UnlessSession>
                  <Row
                    alignItems="center"
                    gap={5}
                    paddingTop={15}
                    fontSize={13}
                    color={colors.slate['700']}
                    borderTop={`1px solid ${colors.slate['200']}`}
                  >
                    <NavLink
                      to="/account/login"
                      style={{ color: colors.blue['700'] }}
                    >
                      Log In
                    </NavLink>

                    <Block>or</Block>

                    <NavLink
                      to="/account/signup"
                      style={{ color: colors.blue['700'] }}
                    >
                      Create New Account
                    </NavLink>
                  </Row>
                </UnlessSession>

                <IfSession>
                  <NavLink
                    to="/recordings"
                    style={{ color: colors.blue['700'] }}
                  >
                    Show all recordings
                  </NavLink>
                </IfSession>
              </Col>
            </Row>
          </Card>
        </Row>
      </Grid>
    )
  }

  return (
    <PlaybackFromSourceProvider source={source}>
      <Grid
        gap={15}
        height="calc(100vh - 90px)"
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
