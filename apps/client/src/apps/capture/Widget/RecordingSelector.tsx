import { Row } from 'jsxstyle'
import React from 'react'
import {
  Camera as ScreenshotIcon,
  Clock as ReplayIcon,
  Video as VideoIcon,
} from 'react-feather'
import { colors } from '@/config/theme'
import { Button } from '@/components/Button'
import { Tooltip } from '@/components/Tooltip'
import { RecordingMode } from '@repro/domain'
import { useReadyState, useRecordingMode } from '../hooks'
import { ReadyState } from '../types'

export const RecordingSelector: React.FC = () => {
  const [, setRecordingMode] = useRecordingMode()
  const [, setReadyState] = useReadyState()

  function onUseSnapshot() {
    setReadyState(ReadyState.Ready)
    setRecordingMode(RecordingMode.Snapshot)
  }

  function onUseLive() {
    setReadyState(ReadyState.Pending)
    setRecordingMode(RecordingMode.Live)
  }

  function onUseReplay() {
    setReadyState(ReadyState.Ready)
    setRecordingMode(RecordingMode.Replay)
  }

  return (
    <Row
      position="absolute"
      right={0}
      top="50%"
      transform="translate(calc(100% + 10px), -50%)"
      padding={10}
      alignItems="center"
      gap={10}
      backgroundColor={colors.white}
      borderRadius={2}
      boxShadow={`0 0 16px rgba(0, 0, 0, 0.15)`}
    >
      <Button onClick={onUseSnapshot}>
        <ScreenshotIcon size={16} />
        <Tooltip>Take a screenshot</Tooltip>
      </Button>

      <Button onClick={onUseLive}>
        <VideoIcon size={16} />
        <Tooltip>Record a video</Tooltip>
      </Button>

      <Button onClick={onUseReplay}>
        <ReplayIcon size={16} />
        <Tooltip>Auto-replay. Share your last minute.</Tooltip>
      </Button>
    </Row>
  )
}
