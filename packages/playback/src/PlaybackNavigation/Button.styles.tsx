import { Row } from '@jsxstyle/react'
import { colors } from '@repro/design'
import React, { PropsWithChildren } from 'react'

interface ButtonProps {
  disabled?: boolean
  onClick: () => void
}

export const Button: React.FC<PropsWithChildren<ButtonProps>> = ({
  children,
  disabled,
  onClick,
}) => (
  <Row
    component="button"
    appearance="none"
    alignItems="center"
    justifyContent="center"
    width={32}
    height={32}
    color={disabled ? colors.slate['300'] : colors.blue['700']}
    border="none"
    borderRadius={4}
    backgroundColor="transparent"
    hoverBackgroundColor={disabled ? null : colors.blue['50']}
    cursor="pointer"
    pointerEvents={disabled ? 'none' : 'auto'}
    props={{ disabled, onClick }}
  >
    {children}
  </Row>
)
