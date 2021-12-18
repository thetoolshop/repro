import { Logo } from '@/components/Logo'
import { colors } from '@/config/theme'
import { Block, Row } from 'jsxstyle'
import React, { useCallback } from 'react'
import { useActive } from '../hooks'
import { Picker } from './Picker'
import { Tabs } from './Tabs'
import { TargetNodePreview } from './TargetNodePreview'

export const Toolbar: React.FC = () => {
  const [active, setActive] = useActive()

  const toggleActive = useCallback(() => {
    setActive(active => !active)
  }, [setActive])

  return (
    <Container>
      <Row
        alignItems="center"
        paddingH={10}
        cursor="pointer"
        props={{ onClick: toggleActive }}
      >
        <Logo size={20} />
      </Row>

      <Separator />
      <Picker />

      {active && (
        <React.Fragment>
          <Separator />
          <Tabs />
        </React.Fragment>
      )}

      {!active && <TargetNodePreview />}
    </Container>
  )
}

const Container: React.FC = ({ children }) => (
  <Row alignItems="stretch">{children}</Row>
)

const Separator: React.FC = () => (
  <Block
    alignSelf="center"
    backgroundColor={colors.blueGray['200']}
    height="calc(100% - 20px)"
    width={1}
  />
)
