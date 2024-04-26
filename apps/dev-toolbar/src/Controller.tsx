import { useAtomValue } from '@repro/atom'
import { createLivePlayback, Playback, PlaybackProvider } from '@repro/playback'
import { InterruptSignal, useRecordingStream } from '@repro/recording'
import { Block } from 'jsxstyle'
import React, { useEffect, useState } from 'react'
import { MAX_INT32 } from './constants'
import { Toolbar } from './Toolbar'
import { VisiblePane } from './VisiblePane'

export const Controller: React.FC = () => {
  const stream = useRecordingStream()
  const isRecording = useAtomValue(stream.$started)

  const [playback, setPlayback] = useState<Playback | null>(null)

  useEffect(() => {
    if (isRecording) {
      setPlayback(createLivePlayback(stream.tail(InterruptSignal)))
    } else {
      setPlayback(null)
    }
  }, [isRecording, setPlayback])

  return (
    <PlaybackProvider playback={playback}>
      <Block
        position="fixed"
        bottom={0}
        left={0}
        right={0}
        zIndex={MAX_INT32}
        pointerEvents="none"
      >
        <Toolbar />
        <VisiblePane />
      </Block>
    </PlaybackProvider>
  )
}
