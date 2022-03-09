import { Block, InlineBlock, Row } from 'jsxstyle'
import React, { useCallback, useRef } from 'react'
import { Code as DevToolsIcon } from 'react-feather'
import { colors } from '@/config/theme'
import { TimelineControl } from '@/components/TimelineControl'
import { PlaybackState, usePlayback, usePlaybackState } from '@/libs/playback'
import { MAX_INT32 } from '../constants'

export const PlaybackControls: React.FC = () => {
  const playback = usePlayback()
  const playbackState = usePlaybackState()
  const resumeOnNext = useRef(false)

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
  }, [resumeOnNext, playback])

  const onSeekEnd = useCallback(() => {
    if (resumeOnNext.current) {
      resumeOnNext.current = false
      playback.play()
    }
  }, [resumeOnNext, playback])

  const onSeek = useCallback(
    (offset: number) => {
      playback.seekToTime(playback.getDuration() - offset)
    },
    [playback]
  )

  return (
    <Container>
      <TimelineRegion>
        <TimelineControl
          initialValue={0}
          maxValue={playback.getDuration()}
          playing={playbackState === PlaybackState.Playing}
          onPause={onPause}
          onPlay={onPlay}
          onSeekStart={onSeekStart}
          onSeekEnd={onSeekEnd}
          onSeek={onSeek}
        />
      </TimelineRegion>
    </Container>
  )
}

const Container: React.FC = ({ children }) => (
  <Row
    alignItems="stretch"
    height={50}
    background={colors.white}
    boxShadow="0 4px 16px rgba(0, 0, 0, 0.1)"
    isolation="isolate"
    zIndex={MAX_INT32}
  >
    {children}
  </Row>
)

const TimelineRegion: React.FC = ({ children }) => (
  <Block flex={1} marginV={10} marginH={16}>
    {children}
  </Block>
)
