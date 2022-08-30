import { Block, Row } from 'jsxstyle'
import React from 'react'
import { Check as FinishIcon, Loader as LoaderIcon } from 'react-feather'
import { Button } from '@/components/Button'
import { colors } from '@/config/theme'
import { interrupt } from '@/libs/record'
import { useReadyState } from '../hooks'
import { ReadyState } from '../types'
import { Spin } from '@/components/FX'

export const LiveRecordingControls: React.FC = () => {
  const [, setReadyState] = useReadyState()

  function onStop() {
    interrupt()
    setReadyState(ReadyState.Ready)
  }

  return (
    <Row
      position="absolute"
      right={0}
      top="50%"
      transform="translate(calc(100% + 10px), -50%)"
      padding={10}
      alignItems="center"
      gap={10}
      backgroundColor={colors.white}
      borderRadius={2}
      boxShadow={`0 0 16px rgba(0, 0, 0, 0.15)`}
    >
      <Button onClick={onStop}>
        <FinishIcon size={16} /> Finish
      </Button>

      <Row alignItems="center" gap={5} fontSize={16}>
        <Spin color={colors.blue['700']}>
          <LoaderIcon size={16} />
        </Spin>

        <Block fontSize={13}>Recording...</Block>
      </Row>
    </Row>
  )
}
