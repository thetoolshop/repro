import { Row } from '@jsxstyle/react'
import { colors } from '@repro/design'
import React, { PropsWithChildren } from 'react'

interface ButtonProps {
  onClick: () => void
}

export const Button: React.FC<PropsWithChildren<ButtonProps>> = ({
  children,
  onClick,
}) => (
  <Row
    alignItems="center"
    justifyContent="center"
    width={32}
    height={32}
    color={colors.blue['700']}
    borderRadius={4}
    hoverBackgroundColor={colors.blue['50']}
    cursor="pointer"
    props={{ onClick }}
  >
    {children}
  </Row>
)
