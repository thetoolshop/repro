import { colors } from '@repro/design'
import { PlaybackTimeline } from '@repro/playback'
import { Block, Row } from 'jsxstyle'
import React, { PropsWithChildren } from 'react'
import { Picker } from './Picker'
import { Tabs } from './Tabs'

export const Toolbar: React.FC = () => {
  return (
    <Container>
      <Picker />
      <Separator />
      <Tabs />
      <Separator />

      <TimelineRegion>
        <PlaybackTimeline.Simple />
      </TimelineRegion>
    </Container>
  )
}

const Container: React.FC<PropsWithChildren> = ({ children }) => (
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

const TimelineRegion: React.FC<PropsWithChildren> = ({ children }) => (
  <Block flex={1} marginV={10} marginH={16}>
    {children}
  </Block>
)
