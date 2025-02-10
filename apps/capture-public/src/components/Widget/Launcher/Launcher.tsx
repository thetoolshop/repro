import { Button, colors, Logo, Tooltip } from '@repro/design'
import { RecordingMode } from '@repro/domain'
import { Col } from '@jsxstyle/react'
import React from 'react'
import { ReadyState, useReadyState, useRecordingMode } from '~/state'

export const Launcher: React.FC = () => {
  const [recordingMode, setRecordingMode] = useRecordingMode()
  const [, setReadyState] = useReadyState()

  function onUseReplay() {
    setReadyState(ReadyState.Ready)
    setRecordingMode(RecordingMode.Replay)
  }

  function onReset() {
    setReadyState(ReadyState.Idle)
    setRecordingMode(RecordingMode.None)
  }

  return (
    <Col
      alignItems="flex-start"
      padding={5}
      backgroundColor={colors.white}
      borderRadius={6}
      border={`1px solid ${colors.blue['900']}`}
      boxShadow="0 0 16px rgba(0, 0, 0, 0.15)"
      transform="translate(20px, -20px)"
    >
      {recordingMode === RecordingMode.None && (
        <Button onClick={onUseReplay}>
          <Logo inverted size={24} />
          <Tooltip position="top">Report a bug</Tooltip>
        </Button>
      )}

      {recordingMode !== RecordingMode.None && (
        <Button variant="outlined" onClick={onReset}>
          <Logo size={24} />
        </Button>
      )}
    </Col>
  )
}
