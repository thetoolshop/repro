import React from 'react'
import { Row } from 'jsxstyle'
import { colors } from '@/config/theme'

interface Props {
  size?: 'small' | 'medium' | 'large'
  variant?: 'primary' | 'secondary'
  onClick?: () => void
}

const sizes = {
  small: 6,
  medium: 8,
  large: 12,
}

const MINIMUM_FONT_SIZE = 12

export const Button: React.FC<Props> = ({
  children,
  size = 'medium',
  variant = 'primary',
  onClick,
}) => {
  const base = sizes[size]
  const height = base * 5
  const paddingH = base * 2
  const fontSize = Math.max(base * 1.5, MINIMUM_FONT_SIZE)
  const gap = base

  return (
    <Row
      component="button"
      props={{ onClick }}
      // CSS Props
      alignItems="center"
      backgroundColor={
        variant === 'primary' ? colors.blue['700'] : 'transparent'
      }
      borderColor={colors.blue['700']}
      borderStyle="solid"
      borderWidth={2}
      boxSizing="border-box"
      color={variant === 'primary' ? colors.white : colors.blue['900']}
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
