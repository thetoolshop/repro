import { Inline, InlineBlock } from 'jsxstyle'
import React from 'react'
import { colors } from '@/config/theme'
import { VElement } from '@/types/vdom'

interface Props {
  node: VElement
}

const OpeningTag: React.FC<Props> = ({ node }) => (
  <InlineBlock>
    <Syntax>&lt;</Syntax>
    <TagName>{node.tagName}</TagName>
    {Object.entries(node.attributes).map(([name, value]) => (
      <Attribute key={name} name={name} value={value} />
    ))}
    <Syntax>&gt;</Syntax>
  </InlineBlock>
)

const ClosingTag: React.FC<Props> = ({ node }) => (
  <InlineBlock>
    <Syntax>&lt;/</Syntax>
    <TagName>{node.tagName}</TagName>
    <Syntax>&gt;</Syntax>
  </InlineBlock>
)

const Syntax: React.FC = ({ children }) => (
  <Inline color={colors.blueGray['400']}>{children}</Inline>
)

const TagName: React.FC = ({ children }) => (
  <Inline color={colors.blue['700']}>{children}</Inline>
)

interface AttributeProps {
  name: string
  value: string
}

const Attribute: React.FC<AttributeProps> = ({ name, value }) => (
  <InlineBlock marginLeft="0.4rem">
    <Inline color={colors.pink['500']}>{name}</Inline>
    <Syntax>="</Syntax>
    <Inline color={colors.green['600']}>{value}</Inline>
    <Syntax>"</Syntax>
  </InlineBlock>
)

export const ElementNode = {
  OpeningTag,
  ClosingTag,
}
