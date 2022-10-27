import { done } from 'fluture'
import { Block, InlineBlock } from 'jsxstyle'
import React, { Fragment, useEffect, useState } from 'react'
import { RecordingMode, User } from '@repro/domain'
import { colors } from '~/config/theme'
import { useApiCaller, useMessaging } from '~/libs/messaging'
import {
  useActive,
  useCurrentUser,
  useReadyState,
  useRecordingMode,
} from '../hooks'
import { ReadyState } from '../types'
import { Launcher } from './Launcher'
import { LiveControls } from './LiveControls'
import { RecordingModeSelector } from './RecordingModeSelector'
import { ReportWizard } from './ReportWizard'

export const Widget: React.FC = () => {
  const agent = useMessaging()
  const callApi = useApiCaller()
  const [, setActive] = useActive()
  const [, setCurrentUser] = useCurrentUser()
  const [recordingMode, setRecordingMode] = useRecordingMode()
  const [readyState, setReadyState] = useReadyState()

  useEffect(() => {
    return callApi<User>('user', 'getMyUser').pipe(
      done((_, user) => {
        setCurrentUser(user ?? null)
      })
    )
  }, [agent, setCurrentUser])

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
