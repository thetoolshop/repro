import { Row } from 'jsxstyle'
import React from 'react'
import { Logo } from '@/components/Logo'
import { colors } from '@/config/theme'

export const Header: React.FC = () => (
  <Row
    alignItems="center"
    borderBottom={`1px solid ${colors.blueGray['300']}`}
    gridArea="header"
    paddingH={10}
  >
    <Logo size={20} />
  </Row>
)
