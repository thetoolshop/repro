import { Button, colors } from '@repro/design'
import { DevTools } from '@repro/devtools'
import {
  PlaybackProvider,
  RangeTimeline,
  createSourcePlayback,
} from '@repro/playback'
import { randomString } from '@repro/random-string'
import { useRecordingStream } from '@repro/recording'
import { packList } from '@repro/std/src/list-utils'
import { Block, Row } from 'jsxstyle'
import { DownloadIcon, HistoryIcon } from 'lucide-react'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

export const InstantReplayPane: React.FC = () => {
  const stream = useRecordingStream()

  const playback = useMemo(
    () => createSourcePlayback(stream.slice(), {}),
    [stream]
  )

  const [min, setMin] = useState(0)
  const [max, setMax] = useState(playback.getDuration())

  useEffect(() => {
    setMax(playback.getDuration())
  }, [playback, setMax])

  const onUpdateRange = useCallback(
    (min: number, max: number) => {
      setMin(min)
      setMax(max)
    },
    [setMin, setMax]
  )

  const onSave = useCallback(() => {
    const minIndex = playback.getEventIndexAtTime(min)
    const maxIndex = playback.getEventIndexAtTime(max)

    const eventData = new Blob([
      packList(stream.slice(minIndex ?? undefined, maxIndex ?? undefined)),
    ])

    const recordingId = randomString(8)

    const anchor = document.createElement('a')
    anchor.href = URL.createObjectURL(eventData)
    anchor.download = `${recordingId}.repro`
    anchor.click()
  }, [stream, min, max])

  return (
    <PlaybackProvider playback={playback}>
      <Block
        position="absolute"
        bottom={60}
        right={20}
        background={colors.slate['100']}
        borderColor={colors.slate['700']}
        borderStyle="solid"
        borderWidth="3px 1px 1px"
        pointerEvents="auto"
      >
        <Row
          alignItems="center"
          gap={5}
          padding={10}
          borderColor={colors.slate['300']}
          borderStyle="solid"
          borderWidth="0 0 1px"
          pointerEvents="auto"
        >
          <HistoryIcon size={24} color={colors.slate['700']} />

          <Block color={colors.slate['700']} fontSize={16}>
            Instant Replay
          </Block>

          <Block marginLeft="auto">
            <Button
              context="neutral"
              size="small"
              rounded={false}
              onClick={onSave}
            >
              <DownloadIcon size={16} />
              <Block>Save</Block>
            </Button>
          </Block>
        </Row>

        <Block
          width="calc(100vw - 40px)"
          height="85vh"
          borderRadius={4}
          overflow="hidden"
        >
          <DevTools timeline={<RangeTimeline onChange={onUpdateRange} />} />
        </Block>
      </Block>
    </PlaybackProvider>
  )
}
