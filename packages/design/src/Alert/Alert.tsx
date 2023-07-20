import { Block, Row } from 'jsxstyle'
import React, { PropsWithChildren } from 'react'
import { colors } from '../theme'

type AlertType = 'info' | 'success' | 'warning' | 'danger'

const backgroundColorMap: Record<AlertType, string> = {
  info: colors.blue['100'] as string,
  success: colors.green['100'] as string,
  warning: colors.amber['100'] as string,
  danger: colors.red['100'] as string,
}

const colorMap: Record<AlertType, string> = {
  info: colors.blue['700'] as string,
  success: colors.green['700'] as string,
  warning: colors.amber['700'] as string,
  danger: colors.red['700'] as string,
}

type Props = PropsWithChildren<{
  type: AlertType
  icon?: React.ReactNode
}>

export const Alert: React.FC<Props> = ({ children, icon, type }) => (
  <Row
    alignItems="center"
    padding={32}
    background={backgroundColorMap[type]}
    color={colorMap[type]}
    fontSize={16}
    lineHeight={1}
    borderRadius={4}
  >
    {icon && <Block marginRight={8}>{icon}</Block>}
    <Block>{children}</Block>
  </Row>
)
