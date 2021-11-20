import { colors } from '@/config/theme'
import { Block } from 'jsxstyle'
import React from 'react'
import { TailwindColorGroup } from 'tailwindcss/tailwind-config'

interface Props {
  colorGroup: TailwindColorGroup
  type: 'primary' | 'secondary'
}

export const Label: React.FC<Props> = ({ children, colorGroup, type }) => (
  <Block
    backgroundColor={type === 'primary' ? colorGroup['600'] : colors.white}
    borderColor={type === 'primary' ? colorGroup['600'] : colorGroup['800']}
    borderRadius={2}
    borderStyle="solid"
    borderWidth={1}
    color={type === 'primary' ? colors.white : colorGroup['800']}
    fontSize="1.3rem"
    padding="1rem 0.5rem"
  >
    {children}
  </Block>
)
