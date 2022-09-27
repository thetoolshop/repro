import { Block, Col, Row } from 'jsxstyle'
import React from 'react'
import {
  Camera as ScreenshotIcon,
  ChevronRight as ChevronIcon,
  Clock as ReplayIcon,
  Video as VideoIcon,
} from 'react-feather'
import { colors } from '~/config/theme'
import { RecordingMode } from '@repro/domain'
import { useReadyState, useRecordingMode } from '../hooks'
import { ReadyState } from '../types'

export const RecordingSelector: React.FC = () => {
  const [, setRecordingMode] = useRecordingMode()
  const [, setReadyState] = useReadyState()

  function onUseSnapshot() {
    setReadyState(ReadyState.Ready)
    setRecordingMode(RecordingMode.Snapshot)
  }

  function onUseLive() {
    setReadyState(ReadyState.Pending)
    setRecordingMode(RecordingMode.Live)
  }

  function onUseReplay() {
    setReadyState(ReadyState.Ready)
    setRecordingMode(RecordingMode.Replay)
  }

  return (
    <Col
      position="absolute"
      left={0}
      top={0}
      width={320}
      transform="translate(0, calc(-100% - 10px))"
      padding={10}
      gap={10}
      backgroundColor={colors.white}
      borderRadius={2}
      boxShadow={`0 0 16px rgba(0, 0, 0, 0.15)`}
    >
      <Action
        icon={<ScreenshotIcon size={20} />}
        label="Screenshot"
        helpText="Snap a region or the whole page"
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
    </Col>
  )
}

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
      <Block fontSize={15} fontWeight={700}>
        {label}
      </Block>
      <Block color={colors.slate['500']}>{helpText}</Block>
    </Col>

    <Block marginLeft="auto">
      <ChevronIcon size={20} />
    </Block>
  </Row>
)
