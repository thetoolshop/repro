import { RecordingMetadata, RecordingMode } from '@repro/domain'
import { fork, map } from 'fluture'
import { Block, Col, Grid } from 'jsxstyle'
import { Camera as CameraIcon, Video as VideoIcon } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '~/components/Card'
import { colors } from '~/config/theme'
import { useApiClient } from '~/libs/api'
import { logger } from '~/libs/logger'
import { formatDate, formatTime } from '~/utils/date'
import { ucfirst } from '~/utils/string'

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
      <Col>
        {recordings.map((recording, i) => (
          <Grid
            key={recording.id}
            gridTemplateColumns="auto 1fr 60px 240px 240px 120px"
            alignItems="center"
            gap={10}
            marginH={-20}
            padding={20}
            fontSize={13}
            borderTop={i !== 0 ? `1px solid ${colors.slate['200']}` : undefined}
          >
            <Block color={colors.blue['700']}>
              {recording.mode === RecordingMode.Live && <VideoIcon size={16} />}

              {recording.mode === RecordingMode.Replay && (
                <VideoIcon size={16} />
              )}

              {recording.mode === RecordingMode.Snapshot && (
                <CameraIcon size={16} />
              )}
            </Block>

            <Block
              component={Link}
              color={colors.blue['500']}
              textDecoration="none"
              props={{ to: `/recordings/${recording.id}` }}
            >
              {recording.title}
            </Block>

            <Block>{formatTime(recording.duration, 'seconds')}</Block>

            <Block>
              {recording.browserName &&
                `${ucfirst(recording.browserName)} ${recording.browserVersion}`}
            </Block>

            <Block>{recording.authorName}</Block>

            <Block color={colors.slate['700']}>
              {formatDate(recording.createdAt)}
            </Block>
          </Grid>
        ))}
      </Col>
    </Card>
  )
}
