import React, { useEffect, useState } from 'react'
import { Block, Grid } from 'jsxstyle'
import { Shortcuts } from 'shortcuts'
import { Logo } from '@/components/Logo'
import { Modal } from '@/components/Modal'
import { colors } from '@/config/theme'
import { Stats } from '@/libs/diagnostics'
import {
  EMPTY_PLAYBACK,
  PlaybackCanvas,
  PlaybackProvider,
  usePlayback,
} from '@/libs/playback'
import {
  Recording,
  SnapshotEvent,
  SourceEvent,
  SourceEventType,
} from '@/types/recording'
import { ArrayBufferBackedList } from '@/utils/lang'
import { applyEventToSnapshot, createRecordingId } from '@/utils/source'
import {
  createEventDecoder,
  createEventEncoder,
  readEventTime,
  readEventType,
  writeEventTimeOffset,
} from '@/libs/codecs/event'
import { copy as copyArrayBuffer } from '@/libs/codecs/common'
import { MAX_INT32 } from '../constants'
import { ExporterButton } from './ExporterButton'
import { encodeRecording } from '@/libs/codecs/recording'

type PlaybackRange = [number, number]

interface Props {
  onClose(): void
}

function createRecordingAtRange(
  sourceEvents: ArrayBufferBackedList<SourceEvent>,
  range: PlaybackRange
): Recording {
  const eventBuffers: Array<ArrayBuffer> = []
  let duration = 0

  const eventDecoder = createEventDecoder()
  const eventEncoder = createEventEncoder()

  Stats.time('ExporterModal: create recording from range', () => {
    let leadingSnapshotBuffer: ArrayBuffer | null = null
    const leadingEventBuffers: Array<ArrayBuffer> = []

    let trailingSnapshotBuffer: ArrayBuffer | null = null
    const trailingEventBuffers: Array<ArrayBuffer> = []

    for (let i = 0, len = sourceEvents.size(); i < len; i++) {
      const event = sourceEvents.at(i)

      if (event) {
        const time = readEventTime(event)
        const type = readEventType(event)

        if (time <= range[0]) {
          if (type === SourceEventType.Snapshot) {
            leadingSnapshotBuffer = copyArrayBuffer(event)
            leadingEventBuffers.length = 0
          } else {
            leadingEventBuffers.push(event)
          }
        } else if (time > range[0] && time < range[1]) {
          eventBuffers.push(copyArrayBuffer(event))
        } else if (time >= range[1]) {
          if (trailingSnapshotBuffer === null) {
            if (type === SourceEventType.Snapshot) {
              trailingSnapshotBuffer = copyArrayBuffer(event)
            } else {
              trailingEventBuffers.unshift(event)
            }
          }
        }
      }
    }

    if (!leadingSnapshotBuffer || !trailingSnapshotBuffer) {
      throw new Error('ExporterModal: cannot find leading or trailing snapshot')
    }

    if (leadingEventBuffers.length > 0) {
      const leadingSnapshotEvent = eventDecoder(
        leadingSnapshotBuffer
      ) as SnapshotEvent

      for (const buffer of leadingEventBuffers) {
        const event = eventDecoder(buffer)
        applyEventToSnapshot(leadingSnapshotEvent.data, event, event.time)
        leadingSnapshotEvent.time = event.time
      }

      leadingSnapshotBuffer = eventEncoder(leadingSnapshotEvent)
    }

    if (trailingEventBuffers.length > 0) {
      const trailingSnapshotEvent = eventDecoder(
        trailingSnapshotBuffer
      ) as SnapshotEvent

      for (const buffer of trailingEventBuffers) {
        const event = eventDecoder(buffer)
        applyEventToSnapshot(
          trailingSnapshotEvent.data,
          event,
          event.time,
          true
        )
        trailingSnapshotEvent.time = event.time
      }

      trailingSnapshotBuffer = eventEncoder(trailingSnapshotEvent)
    }

    eventBuffers.unshift(leadingSnapshotBuffer)
    eventBuffers.push(trailingSnapshotBuffer)

    const firstEvent = eventBuffers[0]
    const lastEvent = eventBuffers[eventBuffers.length - 1]

    duration =
      firstEvent && lastEvent
        ? readEventTime(lastEvent) - readEventTime(firstEvent)
        : 0

    const timeOffset = firstEvent ? readEventTime(firstEvent) : 0

    for (const event of eventBuffers) {
      writeEventTimeOffset(event, timeOffset)
    }
  })

  return {
    id: createRecordingId(),
    events: new ArrayBufferBackedList(eventBuffers, eventDecoder, eventEncoder),
    duration,
  }
}

export const ExporterModal: React.FC<Props> = ({ onClose }) => {
  const sourcePlayback = usePlayback()
  const [playback, setPlayback] = useState(EMPTY_PLAYBACK)
  const [range, setRange] = useState<PlaybackRange>([0, playback.getDuration()])

  useEffect(() => {
    setPlayback(sourcePlayback.copy())
  }, [sourcePlayback, setPlayback])

  useEffect(() => {
    setRange([0, playback.getDuration()])
    playback.seekToTime(0)
  }, [playback, setRange])

  useEffect(() => {
    const shortcuts = new Shortcuts()

    shortcuts.add({
      shortcut: 'Escape',
      handler: onClose,
    })

    return () => {
      shortcuts.reset()
    }
  }, [onClose])

  const handleExport = () => {
    const events = playback.getSourceEvents()

    if (events) {
      const recording = createRecordingAtRange(events, range)
      const encoded = encodeRecording(recording)
    }
  }

  return (
    <PlaybackProvider playback={playback}>
      <Block isolation="isolate" zIndex={MAX_INT32}>
        <Modal width="auto" height="auto" onClose={onClose}>
          <Grid width="80vw" height="80vh" gridTemplateRows="1fr auto">
            <PlaybackCanvas interactive={false} scaling="scale-to-fit" />
            <Grid
              gridColumnGap={16}
              gridTemplateColumns="auto 1fr auto"
              height={50}
              alignItems="center"
              paddingH={16}
              background={colors.white}
              borderTopStyle="solid"
              borderTopWidth={1}
              borderTopColor={colors.slate['300']}
              boxShadow={`0 -4px 16px rgba(0, 0, 0, 0.1)`}
            >
              <Logo size={20} />
              <Block />
              <ExporterButton onClick={handleExport} />
            </Grid>
          </Grid>
        </Modal>
      </Block>
    </PlaybackProvider>
  )
}
