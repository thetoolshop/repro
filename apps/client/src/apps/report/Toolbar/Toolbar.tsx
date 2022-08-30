import { Logo } from '@/components/Logo'
import { colors } from '@/config/theme'
import { PlaybackTimeline, usePlayback } from '@/libs/playback'
import { Block, Row } from 'jsxstyle'
import React, { PropsWithChildren, useCallback } from 'react'
import { ExporterButton } from '../Exporter'
import { useInspecting, useReporting } from '../hooks'
import { Picker } from './Picker'
import { Tabs } from './Tabs'

interface Props {
  disableExport?: boolean
  disableToggle?: boolean
  hideLogo?: boolean
}

export const Toolbar: React.FC<Props> = ({
  disableExport,
  disableToggle,
  hideLogo,
}) => {
  const playback = usePlayback()
  const [, setInspecting] = useInspecting()
  const [, setReporting] = useReporting()

  const toggleInspector = useCallback(() => {
    setInspecting(inspecting => !inspecting)
  }, [setInspecting])

  const openReporter = useCallback(() => {
    playback.pause()
    setReporting(true)
  }, [playback, setReporting])

  return (
    <Container>
      {!hideLogo && (
        <Row
          alignItems="center"
          paddingH={10}
          cursor={!disableToggle ? 'pointer' : 'default'}
          props={{ onClick: !disableToggle ? toggleInspector : undefined }}
        >
          <Logo size={20} />
        </Row>
      )}

      <Separator />
      <Picker />
      <Separator />
      <Tabs />
      <Separator />

      <TimelineRegion>
        <PlaybackTimeline.Simple
          min={Math.max(0, playback.getDuration() - 30_000)}
          max={playback.getDuration()}
        />
      </TimelineRegion>

      {!disableExport && (
        <Block alignSelf="center" marginLeft="auto" marginRight={16}>
          <ExporterButton onClick={openReporter} />
        </Block>
      )}
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
