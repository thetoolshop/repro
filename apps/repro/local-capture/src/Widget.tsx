import { colors } from '@repro/design'
import { RecordingMode } from '@repro/domain'
import { Block, InlineBlock } from 'jsxstyle'
import React, { Fragment } from 'react'
import { useReadyState, useRecordingMode } from './hooks'
import { Launcher } from './Launcher'
import { ReadyState } from './types'

export const Widget: React.FC = () => {
  const [recordingMode] = useRecordingMode()
  const [readyState] = useReadyState()

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
        <Launcher />
        {isPendingLiveRecording && <LiveControls />}
        {isReady && <FloatingPlaybackPane />}
      </InlineBlock>
    </Fragment>
  )
}
