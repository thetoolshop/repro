import { Col, Row } from 'jsxstyle'
import React, { useContext } from 'react'
import { Activity, MessageSquare, Settings } from 'react-feather'
import { colors } from '@/config/theme'
import { View, ViewContext } from './view'

export const Menu: React.FC = () => (
  <Col
    alignItems="stretch"
    borderRight={`1px solid ${colors.blueGray['200']}`}
    gap={10}
    paddingV={10}
  >
    <Item view={View.Discussion}>
      <MessageSquare size={20} />
    </Item>

    <Item view={View.Timeline}>
      <Activity size={20} />
    </Item>

    <Item view={View.Settings}>
      <Settings size={20} />
    </Item>
  </Col>
)

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
      backgroundColor={activeView === view && colors.blue['100']}
      color={activeView === view ? colors.blue['900'] : colors.blue['700']}
      cursor="pointer"
      justifyContent="center"
      paddingV={10}
      props={{
        onClick: handleClick
      }}
    >{children}</Row>
  )
}
