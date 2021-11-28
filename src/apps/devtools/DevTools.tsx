import { Block } from 'jsxstyle'
import React, { useEffect } from 'react'
import { Shortcuts } from 'shortcuts'
import { RecordingController } from '@/libs/record'
import { useAtomValue } from '@/utils/state'
import { $active, $picker } from './state'
import { Inspector } from './Inspector'
import { Toolbar } from './Toolbar'
import { PickerOverlay } from './PickerOverlay'

interface Props {
  controller: RecordingController
}

export const DevTools: React.FC<Props> = ({ controller }) => {
  const active = useAtomValue($active)
  const picker = useAtomValue($picker)

  useEffect(() => {
    controller.start()
    return () => controller.stop()
  }, [controller])

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
