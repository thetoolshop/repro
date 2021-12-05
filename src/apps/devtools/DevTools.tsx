import { Block } from 'jsxstyle'
import React, { useEffect } from 'react'
import { useRecordingStream } from '@/libs/record'
import { Inspector } from './Inspector'
import { Toolbar } from './Toolbar'
import { PickerOverlay } from './PickerOverlay'
import { useActive, usePicker } from './hooks'

export const DevTools: React.FC = () => {
  const stream = useRecordingStream()
  const active = useActive()
  const picker = usePicker()

  useEffect(() => {
    stream.start()
    return () => stream.stop()
  }, [stream])

  return (
    <Container>
      {picker && <PickerOverlay />}
      {active && <Inspector />}
      <Toolbar />
    </Container>
  )
}

const MAX_INT32 = 2 ** 32 - 1

const Container: React.FC = ({ children }) => (
  <Block position="fixed" bottom={0} left={0} right={0} zIndex={MAX_INT32}>
    {children}
  </Block>
)
