import { Button, colors } from '@repro/design'
import { RecordingMode } from '@repro/domain'
import { Block, Grid, Inline, Row } from 'jsxstyle'
import React, { useEffect, useState } from 'react'
import { Check as CheckIcon, Video as VideoIcon } from 'lucide-react'
import { interval } from 'rxjs'
import { interrupt } from '~/libs/record'
import { useReadyState, useRecordingMode } from '../hooks'
import { ReadyState } from '../types'
import { WidgetContainer } from './WidgetContainer'

export const LiveControls: React.FC = () => {
  const [, setReadyState] = useReadyState()
  const [, setRecordingMode] = useRecordingMode()
  const [time, setTime] = useState(0)

  useEffect(() => {
    const subscription = interval(1000).subscribe(() =>
      setTime(time => time + 1)
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [setTime])

  function onDone() {
    interrupt()
    setReadyState(ReadyState.Ready)
  }

  function onCancel() {
    setReadyState(ReadyState.Idle)
    setRecordingMode(RecordingMode.None)
  }

  const minutes = (time / 60) | 0
  const seconds = time - minutes * 60

  return (
    <WidgetContainer size="compact">
      <Grid
        width={240}
        alignItems="center"
        gridTemplateColumns="1fr auto auto"
        gap={5}
      >
        <Row alignItems="center" gap={10}>
          <Row
            alignItems="center"
            justifyContent="center"
            width={30}
            height={30}
            backgroundColor={colors.blue['100']}
            borderRadius="99rem"
          >
            <VideoIcon color={colors.blue['700']} size={16} />
          </Row>

          <Block fontSize={16} color={colors.slate['800']}>
            <Inline>{minutes.toString().padStart(2, '0')}</Inline>
            <Inline color={colors.blue['500']}>:</Inline>
            <Inline>{seconds.toString().padStart(2, '0')}</Inline>
          </Block>
        </Row>

        <Button size="small" onClick={onDone}>
          <CheckIcon size={16} />
          Done
        </Button>

        <Button
          size="small"
          context="neutral"
          variant="outlined"
          onClick={onCancel}
        >
          Cancel
        </Button>
      </Grid>
    </WidgetContainer>
  )
}
