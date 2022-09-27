import React, { PropsWithChildren } from 'react'
import { Row } from 'jsxstyle'
import { colors } from '~/config/theme'

type Props = PropsWithChildren<{
  size?: 'small' | 'medium' | 'large'
  variant?: 'contained' | 'outlined' | 'text'
  context?: 'info' | 'success' | 'warning' | 'danger' | 'neutral'
  onClick?: () => void
}>

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
  neutral: colors.slate,
}

const MINIMUM_FONT_SIZE = 12

export const Button: React.FC<Props> = ({
  children,
  size = 'medium',
  variant = 'contained',
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
      position="relative"
      component="button"
      props={{ onClick }}
      gap={gap}
      height={height}
      paddingH={paddingH}
      alignItems="center"
      justifyContent="center"
      backgroundColor={
        variant === 'contained' ? colorGroup['700'] : 'transparent'
      }
      hoverBackgroundColor={
        variant === 'contained' ? colorGroup['600'] : colorGroup['50']
      }
      boxSizing="border-box"
      borderColor={variant === 'outlined' ? colorGroup['300'] : 'transparent'}
      borderStyle="solid"
      borderWidth={1}
      borderRadius={base / 2}
      color={variant === 'contained' ? colors.white : colorGroup['900']}
      boxShadow={
        variant === 'contained' ? '0 2px 4px rgba(0, 0, 0, 0.25)' : 'none'
      }
      cursor="pointer"
      fontSize={fontSize}
      lineHeight="1em"
      outline="none"
      transition="all linear 100ms"
    >
      {children}
    </Row>
  )
}
