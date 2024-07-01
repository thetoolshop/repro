import { useAtomValue } from '@repro/atom'
import { Button, colors, Logo, Toggle } from '@repro/design'
import { useRecordingStream } from '@repro/recording'
import { Block, Row } from 'jsxstyle'
import {
  DownloadIcon,
  PictureInPictureIcon,
  TablePropertiesIcon,
} from 'lucide-react'
import React from 'react'
import { useVisiblePane } from '../hooks'
import { Pane } from '../types'

export const Toolbar: React.FC = () => {
  const stream = useRecordingStream()
  const [, setVisiblePane] = useVisiblePane()
  const isRecording = useAtomValue(stream.$started)

  function toggleRecording() {
    if (isRecording) {
      stream.stop()
      setVisiblePane(null)
    } else {
      stream.start()
    }
  }

  function openSavePreview() {
    setVisiblePane(pane =>
      pane !== Pane.SaveRecording ? Pane.SaveRecording : null
    )
  }

  function openLivePlayback() {
    setVisiblePane(pane => (pane !== Pane.Playback ? Pane.Playback : null))
  }

  function openEventLog() {
    setVisiblePane(pane => (pane !== Pane.EventLog ? Pane.EventLog : null))
  }

  return (
    <Row
      position="absolute"
      right={20}
      bottom={0}
      paddingInline={10}
      height={50}
      alignItems="center"
      backgroundColor={colors.slate['100']}
      borderColor={colors.slate['700']}
      borderStyle="solid"
      borderWidth="3px 1px 0"
      color={colors.slate['700']}
      fontSize={16}
      pointerEvents="auto"
    >
      <Row alignItems="center" gap={10}>
        <Logo size={24} />

        <Block
          alignSelf="stretch"
          width={1}
          backgroundColor={colors.slate['700']}
        />

        <Toggle
          label="Recording"
          checked={isRecording}
          rounded={false}
          onChange={toggleRecording}
        />

        <Button
          context="neutral"
          size="small"
          rounded={false}
          onClick={openSavePreview}
          disabled={!isRecording}
        >
          <DownloadIcon size={16} />
          <Block>Save Recording</Block>
        </Button>

        <Button
          context="neutral"
          size="small"
          rounded={false}
          onClick={openLivePlayback}
          disabled={!isRecording}
        >
          <PictureInPictureIcon size={16} />
          <Block>Live Playback</Block>
        </Button>

        <Button
          context="neutral"
          size="small"
          rounded={false}
          onClick={openEventLog}
          disabled={!isRecording}
        >
          <TablePropertiesIcon size={16} />
          <Block>Event Log</Block>
        </Button>
      </Row>
    </Row>
  )
}
