import { Block, Grid, InlineCol, Row } from 'jsxstyle'
import React from 'react'
import { X as CloseIcon } from 'react-feather'
import { Button } from '@/components/Button'
import { Logo } from '@/components/Logo'
import { colors } from '@/config/theme'
import { RecordingMode } from '@/types/recording'
import { MAX_INT32 } from '../constants'
import { useActive, useReadyState, useRecordingMode } from '../hooks'
import { ReadyState } from '../types'
import { LiveRecordingControls } from './LiveRecordingControls'
import { ReportWizard } from './ReportWizard'
import { RecordingSelector } from './RecordingSelector'

export const Widget: React.FC = () => {
  const [active, setActive] = useActive()
  const [recordingMode, setRecordingMode] = useRecordingMode()
  const [readyState, setReadyState] = useReadyState()

  const toggleActive = () => {
    setActive(active => !active)
    setReadyState(ReadyState.Idle)
    setRecordingMode(RecordingMode.None)
  }

  const isAwaitingRecordingMode = active && recordingMode === RecordingMode.None

  const isAwaitingLiveRecording =
    active &&
    readyState !== ReadyState.Ready &&
    recordingMode === RecordingMode.Live

  const isReady =
    active &&
    readyState === ReadyState.Ready &&
    recordingMode !== RecordingMode.None

  return (
    <InlineCol
      position="relative"
      alignItems="center"
      justifyContent="center"
      height={80}
      width={130}
      transform="translate(20px, -20px)"
      isolation="isolate"
      backgroundColor={colors.white}
      borderRadius={2}
      boxShadow={`0 0 16px rgba(0, 0, 0, 0.15)`}
      zIndex={MAX_INT32}
      pointerEvents="auto"
    >
      <Grid alignSelf="stretch" justifyItems="stretch" marginH={10}>
        <Button
          variant={!active ? 'contained' : 'outlined'}
          onClick={toggleActive}
        >
          {!active ? 'Report A Bug' : <CloseIcon color={colors.blue['700']} />}
        </Button>
      </Grid>

      <Row
        component="a"
        alignItems="center"
        marginTop={10}
        gap={2}
        color={colors.slate['700']}
        textDecoration="none"
        props={{ href: 'https://repro.dev', target: '_blank' }}
      >
        <Block>Powered by</Block>
        <Logo size={12} />
      </Row>

      {isAwaitingRecordingMode && <RecordingSelector />}
      {isAwaitingLiveRecording && <LiveRecordingControls />}
      {isReady && <ReportWizard onClose={toggleActive} />}
    </InlineCol>
  )
}
