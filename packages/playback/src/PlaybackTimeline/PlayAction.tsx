import { Analytics } from '@repro/analytics'
import { colors } from '@repro/design'
import { Row } from '@jsxstyle/react'
import { Pause as PauseIcon, Play as PlayIcon } from 'lucide-react'
import React, { useCallback, useEffect } from 'react'
import { Shortcuts } from 'shortcuts'
import { usePlaybackState } from '..'
import { usePlayback } from '../hooks'
import { PlaybackState } from '../types'

export const PlayAction: React.FC = () => {
  const playback = usePlayback()
  const playbackState = usePlaybackState()
  const playing = playbackState === PlaybackState.Playing

  const togglePlayback = useCallback(
    (evt: Event) => {
      evt.preventDefault()

      if (playing) {
        playback.pause()
        Analytics.track('playback:pause')
      } else {
        if (playback.getElapsed() === playback.getDuration()) {
          playback.seekToTime(0)
        }

        playback.play()
        Analytics.track('playback:play')
      }
    },
    [playback, playing]
  )

  useEffect(() => {
    const shortcuts = new Shortcuts()

    shortcuts.add([
      {
        shortcut: 'Space',
        handler: togglePlayback,
      },
    ])

    return () => {
      shortcuts.reset()
    }
  }, [togglePlayback])

  return (
    <Row
      alignItems="center"
      justifyContent="center"
      width={32}
      height={32}
      color={playing ? colors.pink['500'] : colors.blue['700']}
      backgroundColor={playing ? colors.pink['100'] : 'transparent'}
      borderRadius={4}
      cursor="pointer"
      props={{ onClick: evt => togglePlayback(evt.nativeEvent) }}
    >
      {playing ? <PauseIcon size={16} /> : <PlayIcon size={16} />}
    </Row>
  )
}
