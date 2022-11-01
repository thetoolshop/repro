import {
  CODEC_VERSION,
  Project,
  Recording,
  RecordingMode,
  RecordingView,
  User,
} from '@repro/domain'
import { fork } from 'fluture'
import { Block, Col, Grid, Row } from 'jsxstyle'
import {
  CheckCircle2 as SuccessIcon,
  Copy as CopyIcon,
  CornerUpLeft as BackIcon,
  Loader as LoadingIcon,
  XCircle as ErrorIcon,
} from 'lucide-react'
import React, { PropsWithChildren, useEffect, useState } from 'react'
import { Button } from '~/components/Button'
import { Card } from '~/components/Card'
import * as FX from '~/components/FX'
import { ToggleGroup } from '~/components/ToggleGroup'
import { colors } from '~/config/theme'
import { Analytics } from '~/libs/analytics'
import { LoginForm } from '~/libs/auth'
import { logger } from '~/libs/logger'
import { useApiCaller, useMessaging } from '~/libs/messaging'
import {
  PlaybackCanvas,
  PlaybackProvider,
  PlaybackTimeline,
  usePlayback,
} from '~/libs/playback'
import { sliceEventsAtRange } from '~/libs/record'
import { formatDate } from '~/utils/date'
import { createRecordingId } from '~/utils/source'
import { MAX_INT32 } from '../constants'
import { useCurrentUser, useRecordingMode } from '../hooks'
import { DetailsForm } from './DetailsForm'
import { WidgetContainer } from './WidgetContainer'

const DEFAULT_SELECTED_DURATION = 60_000

type LoginState = 'logged-out' | 'logged-in'
type UploadingState = 'ready' | 'uploading' | 'done' | 'failed'

interface Props {
  onClose: () => void
}

export const ReportWizard: React.FC<Props> = ({ onClose }) => {
  const agent = useMessaging()
  const callApi = useApiCaller()
  const playback = usePlayback()
  const [currentUser, setCurrentUser] = useCurrentUser()
  const [recordingMode] = useRecordingMode()
  const [loginState, setLoginState] = useState<LoginState>(
    currentUser ? 'logged-in' : 'logged-out'
  )
  const [uploading, setUploading] = useState<UploadingState>('ready')
  const [recordingId, setRecordingId] = useState<string | null>(null)
  const [selectedDuration, setSelectedDuration] = useState(
    DEFAULT_SELECTED_DURATION
  )
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const maxTime = playback.getDuration()
  const minTime = Math.max(0, maxTime - selectedDuration)

  const durationOptions = [
    { value: maxTime, label: `Max (${formatDate(maxTime, 'seconds')})` },
    { value: 120_000, label: 'Last 2m' },
    { value: 60_000, label: 'Last 1m' },
    { value: 30_000, label: 'Last 30s' },
    { value: 10_000, label: 'Last 10s' },
  ].filter(option => option.value <= maxTime)

  useEffect(() => {
    playback.seekToTime(minTime)
  }, [playback, minTime])

  useEffect(() => {
    setSelectedDuration(Math.min(DEFAULT_SELECTED_DURATION, maxTime))
  }, [maxTime, setSelectedDuration])

  useEffect(() => {
    if (currentUser) {
      callApi<Array<Project>>('project', 'getAllProjects').pipe(
        fork(logger.error)(projects => {
          // TODO: Support multiple projects
          if (projects[0]) {
            setSelectedProject(projects[0])
          } else {
            logger.error('Team has no projects')
          }
        })
      )
    }
  }, [agent, currentUser, setSelectedProject])

  function handleAuthSuccess(user: User) {
    setCurrentUser(user)
  }

  function handleAuthFailure() {
    setCurrentUser(null)
  }

  useEffect(() => {
    setLoginState(currentUser ? 'logged-in' : 'logged-out')
  }, [currentUser, setLoginState])

  function handleSave(data: { title: string; description: string }) {
    let events = playback.getSourceEvents()

    if (recordingMode === RecordingMode.Replay) {
      events = sliceEventsAtRange(events, [minTime, maxTime])
    }

    const recording: Recording = RecordingView.from({
      id: createRecordingId(),
      codecVersion: CODEC_VERSION,
      mode: recordingMode,
      duration: maxTime - minTime,
      events: events
        .toSource()
        .map(view => view.buffer.slice(view.byteOffset, view.byteLength)),
    })

    setUploading('uploading')

    Analytics.track('capture:save-start', {
      recordingSize: RecordingView.encode(recording).byteLength.toString(),
    })

    fork(onError)(onSuccess)(
      agent.raiseIntent({
        type: 'upload',
        payload: {
          id: recording.id,
          projectId: selectedProject && selectedProject.id,
          title: data.title,
          description: data.description,
          recording: Array.from(
            new Uint8Array(RecordingView.encode(recording).buffer)
          ),
        },
      })
    )

    function onSuccess() {
      Analytics.track('capture:save-success')
      setUploading('done')
      setRecordingId(recording.id)
    }

    function onError(error: Error) {
      logger.error(error)
      Analytics.track('capture:save-failure')
      setUploading('failed')
      setUploadError(error.message)
    }
  }

  return (
    <WidgetContainer title="Create a bug report" size="full-screen">
      <PlaybackProvider playback={playback}>
        <Container>
          <PlaybackRegion>
            {recordingMode === RecordingMode.Replay &&
            durationOptions.length > 1 ? (
              <Row
                gap={10}
                alignItems="center"
                justifyContent="flex-end"
                padding={10}
                zIndex={1}
                boxShadow={`
                  0 4px 16px rgba(0, 0, 0, 0.1),
                  0 1px 2px rgba(0, 0, 0, 0.1)
                `}
              >
                <Block
                  fontSize={13}
                  fontWeight={700}
                  color={colors.slate['700']}
                >
                  Duration
                </Block>

                <ToggleGroup
                  options={durationOptions}
                  selected={selectedDuration}
                  onChange={setSelectedDuration}
                />
              </Row>
            ) : (
              <Block />
            )}

            <PlaybackCanvas
              interactive={false}
              trackPointer={recordingMode !== RecordingMode.Snapshot}
              trackScroll={true}
              scaling="scale-to-fit"
            />

            {(recordingMode === RecordingMode.Live ||
              recordingMode === RecordingMode.Replay) && (
              <Block
                zIndex={1}
                padding={10}
                boxShadow={`
                  0 -4px 16px rgba(0, 0, 0, 0.1),
                  0 -1px 2px rgba(0, 0, 0, 0.1)
                `}
              >
                <PlaybackTimeline.Simple min={minTime} max={maxTime} />
              </Block>
            )}
          </PlaybackRegion>

          <DetailsRegion>
            <DetailsForm onSubmit={handleSave} />
          </DetailsRegion>

          {loginState === 'logged-out' && (
            <BlockingOverlay>
              <Block width={320}>
                <Card>
                  <LoginForm
                    onSuccess={handleAuthSuccess}
                    onFailure={handleAuthFailure}
                  />
                </Card>
              </Block>
            </BlockingOverlay>
          )}

          {uploading === 'uploading' && <PendingOverlay />}

          {uploading === 'done' && recordingId !== null && (
            <SuccessOverlay recordingId={recordingId} onClose={onClose} />
          )}

          {uploading === 'failed' && uploadError && (
            <ErrorOverlay onClose={onClose} errorMessage={uploadError} />
          )}
        </Container>
      </PlaybackProvider>
    </WidgetContainer>
  )
}

const BlockingOverlay: React.FC<PropsWithChildren> = ({ children }) => (
  <Row
    alignItems="center"
    justifyContent="center"
    position="absolute"
    top={0}
    left={0}
    bottom={0}
    right={0}
    backgroundColor="rgba(255, 255, 255, 0.15)"
    backdropFilter="blur(5px)"
    borderRadius={4}
  >
    {children}
  </Row>
)

const Container: React.FC<PropsWithChildren> = ({ children }) => (
  <Grid
    gridTemplateColumns="1fr 420px"
    gridTemplateAreas="'playback details'"
    gap={10}
    position="relative"
    isolation="isolate"
    height="100%"
    width="100%"
    zIndex={MAX_INT32}
    pointerEvents="auto"
  >
    {children}
  </Grid>
)

const PlaybackRegion: React.FC<PropsWithChildren> = ({ children }) => (
  <Grid
    gridArea="playback"
    gridTemplateRows="auto 1fr auto"
    height="100%"
    overflow="hidden"
    isolation="isolate"
    backgroundColor={colors.white}
    borderRadius={4}
    boxShadow={`
      0 4px 16px rgba(0, 0, 0, 0.1),
      0 1px 2px rgba(0, 0, 0, 0.1)
    `}
  >
    {children}
  </Grid>
)

const DetailsRegion: React.FC<PropsWithChildren> = ({ children }) => (
  <Grid gridArea="details" alignItems="stretch">
    <Card>{children}</Card>
  </Grid>
)

const PendingOverlay: React.FC = () => (
  <BlockingOverlay>
    <Card>
      <FX.Spin height={24} color={colors.slate['700']}>
        <LoadingIcon size={24} />
      </FX.Spin>
    </Card>
  </BlockingOverlay>
)

interface SuccessProps {
  recordingId: string
  onClose(): void
}

const SuccessOverlay: React.FC<SuccessProps> = ({ recordingId, onClose }) => {
  const recordingUrl = `${process.env.REPRO_APP_URL}/recordings/${recordingId}`

  function copyToClipboard() {
    navigator.clipboard.writeText(recordingUrl)
  }

  return (
    <BlockingOverlay>
      <Col gap={10}>
        <Card>
          <Row alignItems="center" gap={10}>
            <SuccessIcon size={32} color={colors.green['500']} />

            <Block marginRight={10}>
              <Block
                fontSize={11}
                fontWeight={700}
                color={colors.slate['900']}
                textTransform="uppercase"
              >
                Recording Created
              </Block>

              <Row
                component="a"
                gap={5}
                alignItems="center"
                fontSize={15}
                color={colors.blue['700']}
                marginTop={10}
                props={{
                  href: recordingUrl,
                  target: '_blank',
                }}
              >
                {recordingUrl}
              </Row>
            </Block>

            <Button
              variant="outlined"
              context="neutral"
              onClick={copyToClipboard}
            >
              <CopyIcon size={18} /> Copy
            </Button>
          </Row>
        </Card>

        <Block alignSelf="center">
          <Button variant="text" onClick={onClose}>
            <BackIcon size={16} /> Return To Page
          </Button>
        </Block>
      </Col>
    </BlockingOverlay>
  )
}

interface ErrorProps {
  errorMessage: string
  onClose(): void
}

const ErrorOverlay: React.FC<ErrorProps> = ({ errorMessage, onClose }) => (
  <BlockingOverlay>
    <Col gap={10}>
      <Card>
        <Row alignItems="center" gap={10}>
          <ErrorIcon size={32} color={colors.rose['500']} />

          <Block>
            <Block
              fontSize={11}
              fontWeight={700}
              color={colors.slate['900']}
              textTransform="uppercase"
            >
              Could not create recording
            </Block>

            <Row gap={5} alignItems="center" fontSize={15} marginTop={10}>
              {errorMessage}
            </Row>
          </Block>
        </Row>
      </Card>
      <Block alignSelf="center">
        <Button variant="text" onClick={onClose}>
          <BackIcon size={16} /> Return To Page
        </Button>
      </Block>
    </Col>
  </BlockingOverlay>
)
