import { formatTime } from '@repro/date-utils'
import { colors, ToggleGroup } from '@repro/design'
import { RecordingMode } from '@repro/domain'
import {
  PlaybackCanvas,
  PlaybackProvider,
  PlaybackTimeline,
  usePlayback,
} from '@repro/playback'
import { Block, Row } from 'jsxstyle'
import React, { useEffect, useState } from 'react'
import { useRecordingMode } from '~/state'
import { Modal } from '../Modal'
import { DetailsFields } from './DetailsFields'
import { DetailsRegion, Layout, PlaybackRegion } from './Layout'
import { FormValues } from './types'

const DEFAULT_SELECTED_DURATION = 60_000

interface Props {
  onSubmit(values: FormValues): void
  onClose(): void
}

export const ReportForm: React.FC<Props> = ({ onSubmit, onClose }) => {
  const playback = usePlayback()
  const [recordingMode] = useRecordingMode()
  const [selectedDuration, setSelectedDuration] = useState(
    DEFAULT_SELECTED_DURATION
  )

  const maxTime = playback.getDuration()
  const minTime = Math.max(0, maxTime - selectedDuration)

  const durationOptions = [
    { value: maxTime, label: `Max (${formatTime(maxTime, 'seconds')})` },
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

  return (
    <PlaybackProvider playback={playback}>
      <Modal title="Create a bug report" size="full-screen" onClose={onClose}>
        <Layout>
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
            <DetailsFields
              onSubmit={({ title, description }) =>
                onSubmit({
                  title,
                  description,
                  duration: selectedDuration,
                })
              }
            />
          </DetailsRegion>
        </Layout>
      </Modal>
    </PlaybackProvider>
  )
}
