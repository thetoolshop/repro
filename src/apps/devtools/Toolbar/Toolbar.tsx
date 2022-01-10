import { Logo } from '@/components/Logo'
import { TimelineControl } from '@/components/TimelineControl'
import { colors } from '@/config/theme'
import {
  PlaybackState,
  useLatestControlFrame,
  usePlayback,
  usePlaybackState,
} from '@/libs/playback'
import { Block, Row } from 'jsxstyle'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useActive, useMask } from '../hooks'
import { Picker } from './Picker'
import { Tabs } from './Tabs'
import { TargetNodePreview } from './TargetNodePreview'

export const Toolbar: React.FC = () => {
  const playback = usePlayback()
  const [active, setActive] = useActive()
  const lastestControlFrame = useLatestControlFrame()
  const playbackState = usePlaybackState()
  const [, setMask] = useMask()
  const resumeOnNext = useRef(false)
  const [initialElapsed, setInitialElapsed] = useState(playback.getElapsed())

  useEffect(() => {
    setInitialElapsed(playback.getElapsed())
  }, [playback, lastestControlFrame, setInitialElapsed])

  const toggleActive = useCallback(() => {
    setActive(active => !active)
  }, [setActive])

  const onPlay = useCallback(() => {
    playback.play()
  }, [playback])

  const onPause = useCallback(() => {
    playback.pause()
  }, [playback])

  const onSeekStart = useCallback(() => {
    if (playback.getPlaybackState() === PlaybackState.Playing) {
      resumeOnNext.current = true
      playback.pause()
    }

    setMask(true)
  }, [setMask, resumeOnNext, playback])

  const onSeekEnd = useCallback(() => {
    if (resumeOnNext.current) {
      resumeOnNext.current = false
      playback.play()
    }

    setMask(false)
  }, [resumeOnNext, setMask, playback])

  const onSeek = useCallback(
    (offset: number) => {
      playback.seekToTime(playback.getDuration() - offset)
    },
    [playback]
  )

  return (
    <Container>
      <Row
        alignItems="center"
        paddingH={10}
        cursor="pointer"
        props={{ onClick: toggleActive }}
      >
        <Logo size={20} />
      </Row>

      <Separator />
      <Picker />

      {active && (
        <React.Fragment>
          <Separator />
          <Tabs />
          <Separator />
          <TimelineRegion>
            <TimelineControl
              initialValue={initialElapsed}
              maxValue={playback.getDuration()}
              playing={playbackState === PlaybackState.Playing}
              onPause={onPause}
              onPlay={onPlay}
              onSeek={onSeek}
              onSeekStart={onSeekStart}
              onSeekEnd={onSeekEnd}
            />
          </TimelineRegion>
        </React.Fragment>
      )}

      {!active && <TargetNodePreview />}
    </Container>
  )
}

const Container: React.FC = ({ children }) => (
  <Row alignItems="stretch">{children}</Row>
)

const Separator: React.FC = () => (
  <Block
    alignSelf="center"
    backgroundColor={colors.blueGray['200']}
    height="calc(100% - 20px)"
    width={1}
  />
)

const TimelineRegion: React.FC = ({ children }) => (
  <Block flex={1} marginV={10} marginH={16}>
    {children}
  </Block>
)
