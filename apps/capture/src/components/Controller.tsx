import { RecordingMode, SourceEventType, SourceEventView } from '@repro/domain'
import {
  createSourcePlayback,
  Playback,
  PlaybackProvider,
} from '@repro/playback'
import { InterruptSignal, useRecordingStream } from '@repro/recording'
import { LazyList } from '@repro/std'
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
                ),
                {}
              )
            )
          })
        break

      case RecordingMode.Replay:
        subscription.add(
          defer(() => from(stream.slice()))
            .pipe(observeOn(asyncScheduler))
            .subscribe(events => {
              setPlayback(createSourcePlayback(events, {}))
            })
        )
        break

      case RecordingMode.Live:
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
              setPlayback(createSourcePlayback(events, {}))
            })
        )
        break

      case RecordingMode.None:
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
