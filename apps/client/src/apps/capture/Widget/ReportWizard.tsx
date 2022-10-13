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
import { WidgetContainer } from './WidgetContainer'

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
    <WidgetContainer title="Create a bug report" size="full-screen">
      <PlaybackProvider playback={playback}>
        <Container>
          <PlaybackRegion>
            <PlaybackCanvas
              interactive={false}
              trackPointer={recordingMode !== RecordingMode.Snapshot}
              trackScroll={true}
              scaling="scale-to-fit"
            />

            {(recordingMode === RecordingMode.Live ||
              recordingMode === RecordingMode.Replay) && (
              <Block paddingV={10}>
                <PlaybackTimeline.Simple min={minTime} max={maxTime} />
              </Block>
            )}

            {recordingMode === RecordingMode.Replay && (
              <ToggleGroup
                options={durationOptions}
                selected={selectedDuration}
                onChange={setSelectedDuration}
              />
            )}
          </PlaybackRegion>

          <DetailsRegion>
            <DetailsForm
              title={title}
              onTitleChange={setTitle}
              description={description}
              onDescriptionChange={setDescription}
            />
          </DetailsRegion>

          <FooterRegion>
            <Button onClick={handleSave}>Save</Button>
            <Button variant="outlined" context="neutral" onClick={onClose}>
              Cancel
            </Button>
            {reportURL}
          </FooterRegion>
        </Container>
      </PlaybackProvider>
    </WidgetContainer>
  )
}

const Container: React.FC<PropsWithChildren> = ({ children }) => (
  <Grid
    gridTemplateColumns="320px 1fr"
    gridTemplateRows="1fr auto auto"
    gridTemplateAreas={`"details playback" "details playback" "footer footer"`}
    gap={10}
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
    gridTemplateRows="1fr auto auto"
    gridArea="playback"
    height="100%"
    overflow="hidden"
    padding={10}
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
  <Col
    gridArea="details"
    padding={20}
    backgroundColor={colors.white}
    borderRadius={4}
    boxShadow={`
      0 4px 16px rgba(0, 0, 0, 0.1),
      0 1px 2px rgba(0, 0, 0, 0.1)
    `}
  >
    {children}
  </Col>
)

const FooterRegion: React.FC<PropsWithChildren> = ({ children }) => (
  <Row gridArea="footer" flexDirection="row-reverse" padding={10} gap={10}>
    {children}
  </Row>
)
