import { Inline, Row } from 'jsxstyle'
import React, { useContext } from 'react'
import {
  Code as ElementsIcon,
  Globe as NetworkIcon,
  AlertTriangle as ConsoleIcon,
} from 'react-feather'
import { colors } from '@/config/theme'
import { View, ViewContext } from './view'

export const Tabs: React.FC = () => {
  return (
    <Row alignItems="stretch">
      <Item view={View.Elements}>
        <ElementsIcon size={16} />
        <Inline>Elements</Inline>
      </Item>

      <Item view={View.Network}>
        <NetworkIcon size={16} />
        <Inline>Network</Inline>
      </Item>

      <Item view={View.Console}>
        <ConsoleIcon size={16} />
        <Inline>Console</Inline>
      </Item>
    </Row>
  )
}

interface ItemProps {
  view: View
}

const Item: React.FC<ItemProps> = ({ children, view }) => {
  const [activeView, setActiveView] = useContext(ViewContext)

  const handleClick = () => {
    setActiveView(view)
  }

  return (
    <Row
      alignItems="center"
      borderBottomColor={activeView === view ? colors.blue['900'] : 'transparent'}
      borderBottomStyle="solid"
      borderBottomWidth={2}
      color={activeView === view ? colors.blue['900'] : colors.blue['700']}
      cursor="pointer"
      fontSize={13}
      gap={5}
      marginH={10}
      paddingH={5}
      userSelect="none"
      props={{
        onClick: handleClick
      }}
    >{children}</Row>
  )
}
