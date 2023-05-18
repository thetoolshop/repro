import { useParams } from 'react-router-dom'
import { useApiClient } from '@repro/api-client'
import { Card } from '@repro/design'
import { RecordingMetadata } from '@repro/domain'
import { Block, Grid } from 'jsxstyle'
import React, { useEffect, useState } from 'react'
import {
  createApiSource,
  createNullSource,
  PlaybackFromSourceProvider,
} from '~/libs/playback'
import { useFuture } from '~/utils/future'
import { DevTools } from './DevTools'
import { Loading } from './Loading'
import { RecordingError } from './RecordingError'
import { Sidebar } from './Sidebar'

export const RecordingRoute: React.FC = () => {
  const params = useParams<'recordingId'>()
  const recordingId = params.recordingId
  const apiClient = useApiClient()

  const {
    loading,
    error,
    result: metadata,
  } = useFuture<Error, RecordingMetadata>(() => {
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
