import { Block, InlineBlock } from 'jsxstyle'
import React, { Fragment } from 'react'
import { RecordingMode } from '@repro/domain'
import { colors } from '~/config/theme'
import { useActive, useReadyState, useRecordingMode } from '../hooks'
import { ReadyState } from '../types'
import { Launcher } from './Launcher'
import { LiveControls } from './LiveControls'
import { RecordingModeSelector } from './RecordingModeSelector'
import { ReportWizard } from './ReportWizard'

export const Widget: React.FC = () => {
  const [, setActive] = useActive()
  const [recordingMode, setRecordingMode] = useRecordingMode()
  const [readyState, setReadyState] = useReadyState()

  const toggleActive = () => {
    setActive(active => !active)
    setReadyState(ReadyState.Idle)
    setRecordingMode(RecordingMode.None)
  }

  const isIdle = readyState === ReadyState.Idle
  const isReady = readyState === ReadyState.Ready
  const isPendingLiveRecording =
    readyState === ReadyState.Pending && recordingMode === RecordingMode.Live

  return (
    <Fragment>
      <Block
        position="fixed"
        left={0}
        right={0}
        top={0}
        bottom={0}
        pointerEvents="none"
        borderColor={colors.blue['700']}
        borderStyle="solid"
        borderWidth={isPendingLiveRecording ? 5 : 0}
        transition="all linear 250ms"
      />

      <InlineBlock position="relative" pointerEvents="auto">
        <Launcher onClick={toggleActive} />

        {isIdle && <RecordingModeSelector />}
        {isPendingLiveRecording && <LiveControls />}
        {isReady && <ReportWizard onClose={toggleActive} />}
      </InlineBlock>
    </Fragment>
  )
}
