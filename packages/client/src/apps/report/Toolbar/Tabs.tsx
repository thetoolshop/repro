import { Inline, Row } from 'jsxstyle'
import React, { PropsWithChildren } from 'react'
import {
  Code as ElementsIcon,
  Globe as NetworkIcon,
  AlertTriangle as ConsoleIcon,
} from 'react-feather'
import { colors } from '@/config/theme'
import { View } from '../types'
import { useView } from '../hooks'
import { Tooltip } from '@/components/Tooltip'

export const Tabs: React.FC = () => {
  return (
    <Row alignItems="stretch">
      <Item view={View.Elements}>
        <ElementsIcon size={16} />
        <Inline>Elements</Inline>
      </Item>

      <Item view={View.Network} disabled>
        <NetworkIcon size={16} />
        <Inline>Network</Inline>
        <Tooltip position="bottom">Coming soon</Tooltip>
      </Item>

      <Item view={View.Console} disabled>
        <ConsoleIcon size={16} />
        <Inline>Console</Inline>
        <Tooltip position="bottom">Coming soon</Tooltip>
      </Item>
    </Row>
  )
}

interface ItemProps {
  view: View
  disabled?: boolean
}

const Item: React.FC<PropsWithChildren<ItemProps>> = ({
  children,
  disabled,
  view,
}) => {
  const [activeView, setActiveView] = useView()

  const handleClick = () => {
    if (!disabled) {
      setActiveView(view)
    }
  }

  const color = disabled
    ? colors.slate['300']
    : activeView === view
    ? colors.blue['900']
    : colors.blue['700']

  return (
    <Row
      alignItems="center"
      borderBottomColor={
        activeView === view ? colors.blue['500'] : 'transparent'
      }
      borderBottomStyle="solid"
      borderBottomWidth={2}
      color={color}
      cursor="pointer"
      fontSize={13}
      gap={5}
      marginH={10}
      paddingH={5}
      position="relative"
      userSelect="none"
      props={{
        onClick: handleClick,
      }}
    >
      {children}
    </Row>
  )
}
