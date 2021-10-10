import { Row } from 'jsxstyle'
import React, { useContext } from 'react'
import { Crosshair as ElementPickerIcon } from 'react-feather'
import { colors } from '@/config/theme'
import { View, ViewContext } from './view'

export const ElementPicker: React.FC = () => {
  const [_, setView] = useContext(ViewContext)

  const handleClick = () => {
    setView(View.Elements)
  }

  return (
    <Row
      alignItems="center"
      color={colors.blue['700']}
      cursor="pointer"
      hoverBackgroundColor={colors.blue['50']}
      hoverColor={colors.blue['900']}
      marginH={10}
      paddingH={10}
      transition="all linear 100ms"
      props={{
        onClick: handleClick
      }}
    >
      <ElementPickerIcon size={16} /> 
    </Row>
  )
}
