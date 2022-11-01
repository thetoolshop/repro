import { Block, Row } from 'jsxstyle'
import { FormInput as DefaultLabelIcon } from 'lucide-react'
import React, { PropsWithChildren } from 'react'
import { colors } from '~/config/theme'

interface Props {
  icon?: React.ReactNode
  optional?: boolean
}

const defaultIcon = <DefaultLabelIcon size={18} color={colors.blue['700']} />

export const Label: React.FC<PropsWithChildren<Props>> = ({
  children,
  icon = defaultIcon,
  optional = false,
}) => (
  <Row
    gap={5}
    alignItems="center"
    fontSize={15}
    fontWeight={700}
    color={colors.slate['700']}
  >
    {icon}
    {children}
    {optional && (
      <Block
        color={colors.slate['400']}
        fontSize={11}
        textTransform="uppercase"
      >
        optional
      </Block>
    )}
  </Row>
)
