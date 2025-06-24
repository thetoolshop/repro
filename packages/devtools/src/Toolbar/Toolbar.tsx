import { Block, Row } from '@jsxstyle/react'
import { colors } from '@repro/design'
import { PlaybackNavigation, SimpleTimeline } from '@repro/playback'
import React, { PropsWithChildren } from 'react'
import { Picker } from './Picker'
import { Tabs } from './Tabs'
import { Toggle } from './Toggle'

interface Props {
  timeline?: React.ReactNode
}

export const Toolbar: React.FC<Props> = ({ timeline }) => {
  return (
    <Container>
      <Toggle />
      <Separator />
      <Picker />
      <Separator />
      <Tabs />
      <Separator />

      <TimelineRegion>{timeline ?? <SimpleTimeline />}</TimelineRegion>

      <Separator />
      <PlaybackNavigation />
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
