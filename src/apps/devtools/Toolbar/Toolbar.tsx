import { Button } from '@/components/Button'
import { Logo } from '@/components/Logo'
import { colors } from '@/config/theme'
import { Block, Grid, Row } from 'jsxstyle'
import React, { useCallback, useEffect } from 'react'
import { Crosshair, Eye, EyeOff } from 'react-feather'
import { Shortcuts } from 'shortcuts'
import { useActive, useDevtoolsState, usePicker } from '../hooks'

export const Toolbar: React.FC = () => {
  const state = useDevtoolsState()
  const active = useActive()
  const picker = usePicker()

  const toggleActive = useCallback(() => {
    state.setActive(active => !active)
  }, [state])

  const togglePicker = useCallback(() => {
    state.setPicker(picker => !picker)
  }, [state])

  useEffect(() => {
    const shortcuts = new Shortcuts()

    shortcuts.add([
      { shortcut: 'Ctrl+Alt+Shift+C', handler: togglePicker },
      { shortcut: 'Ctrl+Alt+Shift+I', handler: toggleActive },
    ])

    return () => {
      shortcuts.reset()
    }
  }, [toggleActive, togglePicker])

  return (
    <Container>
      <Logo size={20} />
      <Block />
      <Row justifySelf="end" gap={5}>
        <Button
          size="small"
          variant={active ? 'primary' : 'secondary'}
          onClick={toggleActive}
        >
          <Row alignItems="center" gap={10}>
            {active ? <EyeOff size={16} /> : <Eye size={16} />}
            {active ? 'Close Inspector' : 'Open Inspector'}
          </Row>
        </Button>
        <Button
          size="small"
          variant={picker ? 'primary' : 'secondary'}
          onClick={togglePicker}
        >
          <Crosshair size={20} />
        </Button>
      </Row>
    </Container>
  )
}

const Container: React.FC = ({ children }) => (
  <Grid
    position="fixed"
    bottom={0}
    left={0}
    right={0}
    alignItems="center"
    background={colors.white}
    borderTopColor={colors.blueGray['300']}
    borderTopStyle="solid"
    borderTopWidth={1}
    boxShadow={`0 -4px 16px rgba(0, 0, 0, 0.1)`}
    gridTemplateColumns="auto 1fr auto"
    height={50}
    paddingH={15}
  >
    {children}
  </Grid>
)
