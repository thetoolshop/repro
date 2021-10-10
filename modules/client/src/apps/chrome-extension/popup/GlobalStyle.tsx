import React from 'react'
import { colors } from '@/config/theme'

export const GlobalStyle: React.FC = () => (
  <style>
  {`
    body {
      background: ${colors.white};
      color: ${colors.blueGray['700']};
      font-size: 10px;
      line-height: 1;
      margin: 0;
    }
  `}
  </style>
)
