import { RecordingMetadata } from '@repro/domain'
import { fork, map } from 'fluture'
import { Col } from 'jsxstyle'
import React, { useEffect, useState } from 'react'
import { Card } from '~/components/Card'
import { useApiClient } from '~/libs/api'
import { logger } from '@repro/logger'
import { RecordingTile } from './RecordingTile'

function sortByCreated(recordings: Array<RecordingMetadata>) {
  return recordings.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1))
}

export const HomeRoute: React.FC = () => {
  const [recordings, setRecordings] = useState<Array<RecordingMetadata>>([])
  const apiClient = useApiClient()

  useEffect(() => {
    return apiClient.recording
      .getAllRecordings()
      .pipe(map(sortByCreated))
      .pipe(fork(logger.error)(setRecordings))
  }, [apiClient, setRecordings])

  return (
    <Card>
      <Col gap={10}>
        {recordings.map(recording => (
          <RecordingTile key={recording.id} recording={recording} />
        ))}
      </Col>
    </Card>
  )
}
