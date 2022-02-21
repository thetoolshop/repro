import { Block, InlineBlock, Row } from 'jsxstyle'
import React, { useCallback, useRef } from 'react'
import { Code as DevToolsIcon } from 'react-feather'
import { colors } from '@/config/theme'
import { Button } from '@/components/Button'
import { Logo } from '@/components/Logo'
import { TimelineControl } from '@/components/TimelineControl'
import { PlaybackState, usePlayback, usePlaybackState } from '@/libs/playback'
import { MAX_INT32 } from '../constants'
import { useNavigate } from '../hooks'

export const Header: React.FC = () => {
  const playback = usePlayback()
  const playbackState = usePlaybackState()
  const navigate = useNavigate()
  const resumeOnNext = useRef(false)

  const openDevTools = () => {
    navigate('devtools')
  }

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
      <Row alignItems="center" paddingH={10}>
        <Logo size={20} />
      </Row>

      <Block alignSelf="center" marginRight={8}>
        <Button variant="secondary" size="small" onClick={openDevTools}>
          <DevToolsIcon size={16} />
          <InlineBlock>Open DevTools</InlineBlock>
        </Button>
      </Block>

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
