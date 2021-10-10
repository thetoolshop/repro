import { Row } from 'jsxstyle'
import React from 'react'

import { Logo } from '@/components/Logo'
import { colors } from '@/config/theme'

export const Header: React.FC = () => (
  <Row
    alignItems="center"
    borderBottom={`2px solid ${colors.blueGray['200']}`}
    boxShadow={`0 4px 16px ${colors.blueGray['900']}0D`}
    gridArea="header"
    paddingH={10}
  >
    <Logo size={20} />
  </Row>
)
