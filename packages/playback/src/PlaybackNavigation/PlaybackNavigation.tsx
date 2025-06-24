import { Row } from '@jsxstyle/react'
import { Analytics } from '@repro/analytics'
import { colors, Tooltip } from '@repro/design'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  DotIcon,
  StepBackIcon,
  StepForwardIcon,
} from 'lucide-react'
import React from 'react'
import { usePlayback } from '../hooks'
import { Button } from './Button.styles'

export const PlaybackNavigation: React.FC = () => {
  const playback = usePlayback()

  function stepBack() {
    Analytics.track('playback:step-back')
    playback.seekToEvent(playback.getPreviousBreakpoint())
  }

  function stepBackOneFrame() {
    Analytics.track('playback:step-back-one-frame')
    playback.pause()
    playback.seekToEvent(Math.max(0, playback.getActiveIndex() - 1))
  }

  function stepForward() {
    Analytics.track('playback:step-forward')
    playback.seekToEvent(playback.getNextBreakpoint())
  }

  function stepForwardOneFrame() {
    Analytics.track('playback:step-forward-one-frame')
    playback.pause()

    // TODO: Handle seeking out of bounds
    playback.seekToEvent(playback.getActiveIndex() + 1)
  }

  return (
    <Row paddingH={10}>
      <Button onClick={stepBack}>
        <StepBackIcon size={16} />
        <Tooltip position="top">Step back</Tooltip>
      </Button>

      <Button onClick={stepBackOneFrame}>
        <ChevronLeftIcon size={16} />
        <Tooltip position="top">Back 1 frame</Tooltip>
      </Button>

      <Row alignItems="center" color={colors.slate['500']}>
        <DotIcon size={16} />
      </Row>

      <Button onClick={stepForwardOneFrame}>
        <ChevronRightIcon size={16} />
        <Tooltip position="top">Forward 1 frame</Tooltip>
      </Button>

      <Button onClick={stepForward}>
        <StepForwardIcon size={16} />
        <Tooltip position="top">Step forward</Tooltip>
      </Button>
    </Row>
  )
}
