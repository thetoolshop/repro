import { Block, Row } from 'jsxstyle'
import React from 'react'
import { colors } from '@/config/theme'
import { PlaybackTimeline } from '@/libs/playback'
import { MAX_INT32 } from '../constants'

export const PlaybackControls: React.FC = () => {
  return (
    <Container>
      <TimelineRegion>
        <PlaybackTimeline.Simple />
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
