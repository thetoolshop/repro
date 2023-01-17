import { Block } from 'jsxstyle'
import React from 'react'
import { colors } from '~/config/theme'
import { TreeRow } from './TreeRow'

interface Props {
  level: number
  objectKey: string | null
}

export const UndefinedRenderer: React.FC<Props> = ({ level, objectKey }) => (
  <TreeRow level={level} objectKey={objectKey}>
    <Block color={colors.slate['500']}>undefined</Block>
  </TreeRow>
)
