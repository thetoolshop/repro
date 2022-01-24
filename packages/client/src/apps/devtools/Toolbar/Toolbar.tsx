import { Button } from '@/components/Button'
import { Logo } from '@/components/Logo'
import { TimelineControl } from '@/components/TimelineControl'
import { colors } from '@/config/theme'
import {
  PlaybackState,
  useLatestControlFrame,
  usePlayback,
  usePlaybackState,
} from '@/libs/playback'
import { Block, InlineBlock, Row } from 'jsxstyle'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Code as InspectorIcon } from 'react-feather'
import { ExporterButton } from '../Exporter'
import { useActive, useExporting, useMask } from '../hooks'
import { Picker } from './Picker'
import { Tabs } from './Tabs'
import { TargetNodePreview } from './TargetNodePreview'

export const Toolbar: React.FC = () => {
  const playback = usePlayback()
  const [active, setActive] = useActive()
  const [, setExporting] = useExporting()
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

  const openExporter = useCallback(() => {
    playback.pause()
    setExporting(true)
  }, [playback, setExporting])

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

      {!active && (
        <Block alignSelf="center" marginRight={8}>
          <Button variant="secondary" size="small" onClick={toggleActive}>
            <InspectorIcon size={16} />
            <InlineBlock>Open Inspector</InlineBlock>
          </Button>
        </Block>
      )}

      {active && (
        <React.Fragment>
          <Separator />
          <Picker />
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

          <Block alignSelf="center" marginLeft="auto" marginRight={16}>
            <ExporterButton onClick={openExporter} />
          </Block>
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
    backgroundColor={colors.slate['200']}
    height="calc(100% - 20px)"
    width={1}
  />
)

const TimelineRegion: React.FC = ({ children }) => (
  <Block flex={1} marginV={10} marginH={16}>
    {children}
  </Block>
)
