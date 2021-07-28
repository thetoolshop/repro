import { Block, Col, Grid, Row } from 'jsxstyle'
import React, { useEffect, useState } from 'react'
import { colors } from '@/config/theme'
import {
  initializePlayback,
  pause,
  play,
  PlaybackState,
  seek,
  useDuration,
  useElapsed,
  usePlaybackState,
} from '@/libs/playback'
import { Pause as PauseIcon, Play as PlayIcon } from 'react-feather'

export const Controls: React.FC = () => {
  useEffect(() => {
    initializePlayback(90000)
  }, [])

  return (
    <Grid
      alignItems="center"
      borderTop={`2px solid ${colors.blueGray['200']}`}
      boxShadow={`0 -4px 16px ${colors.blueGray['900']}0D`}
      gridArea="controls"
      gridColumnGap={20}
      gridTemplateColumns="auto 1fr auto"
      padding="0 15px"
    >
      <Control />
      <ProgressBar />
      <Timing />
    </Grid>
  )
}

const Control: React.FC = () => {
  const state = usePlaybackState()

  const handleClick = () => {
    if (state === PlaybackState.Paused) {
      play()
    } else if (state === PlaybackState.Playing) {
      pause()
    }
  }

  return (
    <Row
      alignItems="center"
      color={colors.blue['700']}
      cursor="pointer"
      props={{
        onClick: handleClick
      }}
    >
      {state === PlaybackState.Paused && <PlayIcon size={20} stroke="none" fill="currentColor" />}
      {state === PlaybackState.Playing && <PauseIcon size={20} stroke="none" fill="currentColor" />}
    </Row>
  )
}

const ProgressBar: React.FC = () => {
  const elapsed = useElapsed()
  const duration = useDuration()

  const [hasHover, setHasHover] = useState(false)
  const [seekTo, setSeekTo] = useState<number | null>(null)

  const handleSeekDown = () => {
    if (seekTo !== null) {
      seek(seekTo)
    }
  }

  const handleSeekOver = () => {
    setHasHover(true)
  }

  const handleSeekOut = () => {
    setHasHover(false)
    setSeekTo(null)
  }

  const handleSeekHover = (evt: React.PointerEvent<HTMLDivElement>) => {
    const { x, width } = evt.currentTarget.getBoundingClientRect()
    const cursor = evt.pageX - x
    const relative = cursor > 0 ? cursor / width : 0
    const absolute = Math.round(duration * relative)
    setSeekTo(absolute)
  }

  return (
    <Col
      alignItems="stretch"
      cursor="pointer"
      justifyContent="center"
      position="relative"
      height={8}
      props={{
        onPointerDown: handleSeekDown,
        onPointerMove: handleSeekHover,
        onPointerOver: handleSeekOver,
        onPointerOut: handleSeekOut,
      }}
    >
      <Block
        backgroundColor={colors.gray['200']}
        position="relative"
        pointerEvents="none"
        transition="height linear 100ms"
        style={{
          height: hasHover ? 8 : 4
        }}
      >
        <Block
          backgroundColor={colors.blue['700']}
          left={0}
          pointerEvents="none"
          position="absolute"
          top={0}
          transformOrigin="0 0"
          transition="height linear 100ms"
          width="100%"
          style={{
            height: hasHover ? 8 : 4,
            transform: `scaleX(${elapsed/duration})`
          }}
        />

        {hasHover && seekTo !== null && (
          <React.Fragment>
            <Block
              backgroundColor="rgba(0, 0, 0, 0.1)"
              height={8}
              left={0}
              pointerEvents="none"
              position="absolute"
              top={0}
              transformOrigin="0 0"
              width="100%"
              style={{
                transform: `scaleX(${seekTo/duration})`
              }}
            />

            <Block
              backgroundColor={colors.blue['900']}
              color={colors.white}
              fontSize={11}
              padding="0.2rem 0.4rem"
              position="absolute"
              transform="translate(-50%, -110%)"
              style={{
                left: `${100*seekTo/duration}%` 
              }}
            >
              {formatDate(seekTo)}
            </Block>
          </React.Fragment>
        )}
      </Block>
    </Col>
  )
}

const Timing: React.FC = () => {
  const elapsed = useElapsed()
  const duration = useDuration()

  return (
    <Block
      color={colors.blue['700']}
      fontFamily="monospace"
    >
      {formatDate(elapsed)}/{formatDate(duration)}
    </Block>
  )
}

const formatDate = (value: number) => {
  const minutes = value / 60000 | 0
  const seconds = (value - (minutes * 60000)) / 1000 | 0
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}
