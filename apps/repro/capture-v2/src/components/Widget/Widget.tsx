import { colors } from '@repro/design'
import { RecordingMode } from '@repro/domain'
import { logger } from '@repro/logger'
import { usePlayback } from '@repro/playback'
import { Block, InlineBlock } from 'jsxstyle'
import React, { Fragment, useCallback } from 'react'
import { ReadyState, useReadyState, useRecordingMode } from '~/state'
import { Launcher } from './Launcher'
import { LiveControls } from './LiveControls'
import { ReportForm } from './ReportForm'
import { FormValues } from './ReportForm/types'

export const Widget: React.FC = () => {
  const playback = usePlayback()
  const [recordingMode, setRecordingMode] = useRecordingMode()
  const [readyState, setReadyState] = useReadyState()

  const isReady = readyState === ReadyState.Ready
  const isPendingLiveRecording =
    readyState === ReadyState.Pending && recordingMode === RecordingMode.Live

  const onReset = useCallback(() => {
    setReadyState(ReadyState.Idle)
    setRecordingMode(RecordingMode.None)
  }, [setReadyState, setRecordingMode])

  const onSave = useCallback(
    (values: FormValues) => {
      logger.log(values)
    },
    [playback, recordingMode]
  )

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
        <Launcher />
        {isPendingLiveRecording && <LiveControls />}
        {isReady && <ReportForm onClose={onReset} onSubmit={onSave} />}
      </InlineBlock>
    </Fragment>
  )
}
