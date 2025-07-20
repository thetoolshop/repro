import { Row } from '@jsxstyle/react'
import { Analytics } from '@repro/analytics'
import { colors, Tooltip } from '@repro/design'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CircleSlash2Icon,
  DotIcon,
  StepBackIcon,
  StepForwardIcon,
} from 'lucide-react'
import React from 'react'
import { useBreakpoints, usePlayback } from '../hooks'
import { Button } from './Button.styles'

export const PlaybackNavigation: React.FC = () => {
  const playback = usePlayback()
  const breakpoints = useBreakpoints()
  const hasBreakpoints = breakpoints.length > 0

  function clearBreakpoints() {
    Analytics.track('playback:clear-breakpoints')
    playback.clearBreakpoints()
  }

  function stepBack() {
    Analytics.track('playback:step-back')
    playback.breakPrevious()
  }

  function stepBackOneFrame() {
    Analytics.track('playback:step-back-one-frame')
    // TODO: implement me
  }

  function stepForward() {
    Analytics.track('playback:step-forward')
    playback.breakNext()
  }

  function stepForwardOneFrame() {
    Analytics.track('playback:step-forward-one-frame')
    // TODO: implement me
  }

  return (
    <Row paddingH={10}>
      <Button onClick={stepBack} disabled={!hasBreakpoints}>
        <StepBackIcon size={16} />
        <Tooltip position="top">Previous breakpoint</Tooltip>
      </Button>

      <Button onClick={stepBackOneFrame} disabled={!hasBreakpoints}>
        <ChevronLeftIcon size={16} />
        <Tooltip position="top">Back 1 frame</Tooltip>
      </Button>

      <Button onClick={stepForwardOneFrame} disabled={!hasBreakpoints}>
        <ChevronRightIcon size={16} />
        <Tooltip position="top">Forward 1 frame</Tooltip>
      </Button>

      <Button onClick={stepForward} disabled={!hasBreakpoints}>
        <StepForwardIcon size={16} />
        <Tooltip position="top">Next breakpoint</Tooltip>
      </Button>

      <Row alignItems="center" color={colors.slate['500']}>
        <DotIcon size={16} />
      </Row>

      <Button onClick={clearBreakpoints} disabled={!hasBreakpoints}>
        <CircleSlash2Icon size={16} />
        <Tooltip position="top">Clear breakpoints</Tooltip>
      </Button>
    </Row>
  )
}
