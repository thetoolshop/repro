import { Block, Col, Row } from 'jsxstyle'
import React, { PropsWithChildren } from 'react'
import {
  Camera as ScreenshotIcon,
  ChevronRight as ForwardIcon,
  History as ReplayIcon,
  Video as VideoIcon,
} from 'lucide-react'
import { colors } from '~/config/theme'
import { RecordingMode } from '@repro/domain'
import { useReadyState, useRecordingMode } from '../hooks'
import { ReadyState } from '../types'
import { WidgetContainer } from './WidgetContainer'

export const RecordingModeSelector: React.FC = () => {
  const [, setRecordingMode] = useRecordingMode()
  const [, setReadyState] = useReadyState()

  function onUseSnapshot() {
    setReadyState(ReadyState.Ready)
    setRecordingMode(RecordingMode.Snapshot)
  }

  function onUseReplay() {
    setReadyState(ReadyState.Ready)
    setRecordingMode(RecordingMode.Replay)
  }

  function onUseLive() {
    setReadyState(ReadyState.Pending)
    setRecordingMode(RecordingMode.Live)
  }

  return (
    <WidgetContainer size="normal">
      <Container>
        <Action
          icon={<ScreenshotIcon size={20} />}
          label="Screenshot"
          helpText="Create a snap of your whole page"
          onClick={onUseSnapshot}
        />

        <Action
          icon={<VideoIcon size={20} />}
          label="Video"
          helpText="Create a live recording"
          onClick={onUseLive}
        />

        <Action
          icon={<ReplayIcon size={20} />}
          label="Rewind"
          helpText="Share your last minute"
          onClick={onUseReplay}
        />
      </Container>
    </WidgetContainer>
  )
}

const Container: React.FC<PropsWithChildren> = ({ children }) => (
  <Col
    width={320}
    padding={10}
    gap={10}
    backgroundColor={colors.white}
    borderRadius={4}
    boxShadow={`
      0 4px 16px rgba(0, 0, 0, 0.1),
      0 1px 2px rgba(0, 0, 0, 0.1)
    `}
  >
    {children}
  </Col>
)

interface ActionProps {
  icon: React.ReactNode
  label: string
  helpText: string
  onClick(): void
}

const Action: React.FC<ActionProps> = ({ icon, label, helpText, onClick }) => (
  <Row
    alignItems="center"
    cursor="pointer"
    gap={15}
    padding={15}
    fontSize={13}
    color={colors.slate['800']}
    backgroundColor={colors.slate['100']}
    borderColor="transparent"
    borderWidth={1}
    borderStyle="solid"
    borderRadius={4}
    hoverBackgroundColor={colors.white}
    hoverBorderColor={colors.blue['500']}
    hoverColor={colors.blue['700']}
    hoverBoxShadow={`0 4px 8px ${colors.slate['200']}`}
    transition="all linear 100ms"
    props={{ onClick }}
  >
    <Block color={colors.blue['700']}>{icon}</Block>

    <Col gap={10}>
      <Block fontSize={13} fontWeight={700}>
        {label}
      </Block>
      <Block color={colors.slate['500']}>{helpText}</Block>
    </Col>

    <Block marginLeft="auto">
      <ForwardIcon size={20} />
    </Block>
  </Row>
)
