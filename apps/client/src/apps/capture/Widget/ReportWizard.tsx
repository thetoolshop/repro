import {
  CODEC_VERSION,
  Recording,
  RecordingMode,
  RecordingView,
} from '@repro/domain'
import { Block, Col, Grid, Row } from 'jsxstyle'
import React, { PropsWithChildren, useEffect, useState } from 'react'
import { Shortcuts } from 'shortcuts'
import { Button } from '~/components/Button'
import { Logo } from '~/components/Logo'
import { ToggleGroup } from '~/components/ToggleGroup'
import { colors } from '~/config/theme'
import { useMessaging } from '~/libs/messaging'
import {
  PlaybackCanvas,
  PlaybackProvider,
  PlaybackTimeline,
  usePlayback,
} from '~/libs/playback'
import { sliceEventsAtRange } from '~/libs/record'
import { MAX_INT32 } from '../constants'
import { useRecordingMode } from '../hooks'
import { DetailsForm } from './DetailsForm'
import { formatDate } from '~/utils/date'
import { createRecordingId } from '~/utils/source'
import { Analytics } from '~/libs/analytics'

const DEFAULT_SELECTED_DURATION = 60_000

type UploadingState = 'ready' | 'uploading' | 'done' | 'failed'

interface Props {
  onClose: () => void
}

export const ReportWizard: React.FC<Props> = ({ onClose }) => {
  const agent = useMessaging()
  const playback = usePlayback()
  const [recordingMode] = useRecordingMode()
  const [uploading, setUploading] = useState<UploadingState>('ready')
  const [showPromptBeforeClose, setShowPromptBeforeClose] = useState(false)
  const [selectedDuration, setSelectedDuration] = useState(
    DEFAULT_SELECTED_DURATION
  )
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [reportURL, setReportURL] = useState('')

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
    const shortcuts = new Shortcuts()

    if (!uploading) {
      shortcuts.add({
        shortcut: 'Escape',
        handler: () => setShowPromptBeforeClose(true),
      })
    }

    return () => {
      shortcuts.reset()
    }
  }, [uploading, setShowPromptBeforeClose])

  async function handleSave() {
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

    const [ok, url]: [boolean, string] = await agent.raiseIntent({
      type: 'upload',
      payload: {
        id: recording.id,
        recording: Array.from(
          new Uint8Array(RecordingView.encode(recording).buffer)
        ),
        assets: [],
      },
    })

    if (ok) {
      Analytics.track('capture:save-success')
      setUploading('done')
      setReportURL(url)
    } else {
      Analytics.track('capture:save-failure')
      setUploading('failed')
    }
  }

  return (
    <PlaybackProvider playback={playback}>
      <Container>
        <HeaderRegion>
          <Logo size={20} />
        </HeaderRegion>

        <PlaybackRegion>
          <PlaybackCanvas
            interactive={false}
            trackPointer={recordingMode !== RecordingMode.Snapshot}
            trackScroll={true}
            scaling="scale-to-fit"
          />
        </PlaybackRegion>

        <TimelineRegion>
          {(recordingMode === RecordingMode.Live ||
            recordingMode === RecordingMode.Replay) && (
            <Block padding={10} backgroundColor={colors.slate['100']}>
              <PlaybackTimeline.Simple min={minTime} max={maxTime} />
            </Block>
          )}

          {recordingMode === RecordingMode.Replay && (
            <Block marginTop={10}>
              <ToggleGroup
                options={durationOptions}
                selected={selectedDuration}
                onChange={setSelectedDuration}
              />
            </Block>
          )}
        </TimelineRegion>

        <DetailsRegion>
          <Block
            marginBottom={20}
            fontSize={13}
            fontWeight={700}
            textTransform="uppercase"
            color={colors.slate['900']}
          >
            Create a bug report
          </Block>

          <DetailsForm
            title={title}
            onTitleChange={setTitle}
            description={description}
            onDescriptionChange={setDescription}
          />
        </DetailsRegion>

        <FooterRegion>
          <Button onClick={handleSave}>Save</Button>
          <Button variant="text" context="neutral" onClick={onClose}>
            Cancel
          </Button>
          {reportURL}
        </FooterRegion>
      </Container>
    </PlaybackProvider>
  )
}

const Container: React.FC<PropsWithChildren> = ({ children }) => (
  <Grid
    gridTemplateColumns="320px 1fr"
    gridTemplateRows="auto 1fr auto auto"
    gridTemplateAreas={`"header header" "details playback" "details timeline" "footer footer"`}
    position="absolute"
    left={0}
    bottom={90}
    height="calc(100vh - 130px)"
    width="calc(100vw - 140px)"
    isolation="isolate"
    zIndex={MAX_INT32}
    pointerEvents="auto"
    backgroundColor={colors.white}
    borderRadius={2}
    boxShadow={`0 0 16px rgba(0, 0, 0, 0.15)`}
  >
    {children}
  </Grid>
)

const HeaderRegion: React.FC<PropsWithChildren> = ({ children }) => (
  <Grid
    gridArea="header"
    height={60}
    paddingH={10}
    gridTemplateColumns="100px 1fr 100px"
    alignItems="center"
  >
    {children}
  </Grid>
)

const PlaybackRegion: React.FC<PropsWithChildren> = ({ children }) => (
  <Block
    gridArea="playback"
    height="100%"
    overflow="hidden"
    padding={20}
    paddingBottom={0}
    borderTop={`1px solid ${colors.slate['200']}`}
  >
    {children}
  </Block>
)

const TimelineRegion: React.FC<PropsWithChildren> = ({ children }) => (
  <Block
    gridArea="timeline"
    marginH={20}
    marginBottom={20}
    emptyVisibility="hidden"
  >
    {children}
  </Block>
)

const DetailsRegion: React.FC<PropsWithChildren> = ({ children }) => (
  <Col
    gridArea="details"
    padding={20}
    backgroundColor={colors.slate['50']}
    borderTop={`1px solid ${colors.slate['200']}`}
  >
    {children}
  </Col>
)

const FooterRegion: React.FC<PropsWithChildren> = ({ children }) => (
  <Row
    gridArea="footer"
    flexDirection="row-reverse"
    padding={10}
    gap={10}
    borderTop={`1px solid ${colors.slate['200']}`}
  >
    {children}
  </Row>
)
