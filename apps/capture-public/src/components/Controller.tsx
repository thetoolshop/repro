import { RecordingMode } from '@repro/domain'
import {
  Playback,
  PlaybackProvider,
  createSourcePlayback,
} from '@repro/playback'
import { useRecordingStream } from '@repro/recording'
import { calculateDuration } from '@repro/source-utils'
import { Block } from 'jsxstyle'
import React, { useEffect, useState } from 'react'
import { Subscription, asyncScheduler, defer, observeOn, of } from 'rxjs'
import { MAX_INT32 } from '~/constants'
import { useRecordingMode } from '~/state'
import { Widget } from './Widget'

export const Controller: React.FC = () => {
  const stream = useRecordingStream()

  const [playback, setPlayback] = useState<Playback | null>(null)
  const [recordingMode] = useRecordingMode()

  useEffect(() => {
    stream.start()

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        stream.stop()
      } else {
        if (!stream.isStarted()) {
          stream.start()
        }
      }
    }

    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      stream.stop()
    }
  }, [stream])

  useEffect(() => {
    const subscription = new Subscription()

    switch (recordingMode) {
      case RecordingMode.Replay:
        subscription.add(
          defer(() => of(stream.slice()))
            .pipe(observeOn(asyncScheduler))
            .subscribe(events => {
              setPlayback(
                createSourcePlayback(events, calculateDuration(events), {})
              )
            })
        )
        break

      default:
        setPlayback(null)
        break
    }

    return () => {
      subscription.unsubscribe()
    }
  }, [recordingMode, setPlayback])

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
        <Widget />
      </Block>
    </PlaybackProvider>
  )
}
