import React from 'react'
import { Row } from 'jsxstyle'
import { colors } from '@/config/theme'

interface Props {
  size?: 'small' | 'medium' | 'large'
  variant?: 'primary' | 'secondary'
  context?: 'info' | 'success' | 'warning' | 'danger'
  onClick?: () => void
}

const sizes = {
  small: 6,
  medium: 8,
  large: 12,
}

const colorGroups = {
  info: colors.blue,
  success: colors.green,
  warning: colors.amber,
  danger: colors.red,
}

const MINIMUM_FONT_SIZE = 12

export const Button: React.FC<Props> = ({
  children,
  size = 'medium',
  variant = 'primary',
  context = 'info',
  onClick,
}) => {
  const base = sizes[size]
  const height = base * 5
  const paddingH = base * 2
  const fontSize = Math.max(base * 1.5, MINIMUM_FONT_SIZE)
  const gap = base
  const colorGroup = colorGroups[context]

  return (
    <Row
      component="button"
      props={{ onClick }}
      // CSS Props
      alignItems="center"
      backgroundColor={
        variant === 'primary' ? colorGroup['700'] : colorGroup['50']
      }
      boxSizing="border-box"
      border={0}
      borderRadius={base / 2}
      color={variant === 'primary' ? colors.white : colorGroup['900']}
      cursor="pointer"
      fontSize={fontSize}
      gap={gap}
      height={height}
      justifyContent="center"
      lineHeight="1em"
      outline="none"
      paddingH={paddingH}
    >
      {children}
    </Row>
  )
}
