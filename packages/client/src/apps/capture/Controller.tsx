import { Block } from 'jsxstyle'
import React, { useEffect, useState } from 'react'
import {
  asyncScheduler,
  defer,
  from,
  map,
  observeOn,
  of,
  Subscription,
  toArray,
} from 'rxjs'
import { SourceEventView } from '@/libs/codecs/event'
import { useRecordingStream, InterruptSignal } from '@/libs/record'
import {
  createSourcePlayback,
  Playback,
  PlaybackProvider,
} from '@/libs/playback'
import { RecordingMode, SourceEventType } from '@/types/recording'
import { LazyList } from '@/utils/lang'
import { MAX_INT32 } from './constants'
import { Widget } from './Widget'
import { useActive, useReadyState, useRecordingMode } from './hooks'
import { ReadyState } from './types'

export const Controller: React.FC = () => {
  const stream = useRecordingStream()

  const [playback, setPlayback] = useState<Playback | null>(null)
  const [active] = useActive()
  const [recordingMode] = useRecordingMode()
  const [readyState] = useReadyState()

  useEffect(() => {
    stream.start()

    const onVisibilityChange = () => {
      // TODO: stop after timeout?

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

    if (active) {
      switch (recordingMode) {
        case RecordingMode.Snapshot:
          of(stream.snapshot())
            .pipe(
              map(snapshot =>
                SourceEventView.encode({
                  type: SourceEventType.Snapshot,
                  time: 0,
                  data: snapshot,
                })
              ),
              observeOn(asyncScheduler)
            )
            .subscribe(event => {
              setPlayback(
                createSourcePlayback(
                  new LazyList(
                    [event],
                    SourceEventView.decode,
                    SourceEventView.encode
                  )
                )
              )
            })
          break

        case RecordingMode.Replay:
          subscription.add(
            defer(() => from(stream.slice()))
              .pipe(observeOn(asyncScheduler))
              .subscribe(events => {
                setPlayback(createSourcePlayback(events))
              })
          )
          break

        case RecordingMode.Live:
          if (readyState === ReadyState.Pending) {
            subscription.add(
              stream
                .tail(InterruptSignal)
                .pipe(
                  toArray(),
                  map(
                    events =>
                      new LazyList(
                        events,
                        SourceEventView.decode,
                        SourceEventView.encode
                      )
                  )
                )
                .subscribe(events => {
                  setPlayback(createSourcePlayback(events))
                })
            )
          }
          break

        case RecordingMode.None:
          setPlayback(null)
          break
      }
    } else {
      setPlayback(null)
    }

    return () => {
      subscription.unsubscribe()
    }
  }, [active, readyState, recordingMode, setPlayback])

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
