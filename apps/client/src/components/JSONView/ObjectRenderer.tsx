import { Block, Row } from 'jsxstyle'
import React, { useState } from 'react'
import { colors } from '~/config/theme'
import { getRendererForType } from './getRendererForType'
import { Toggle } from './Toggle'

interface Props {
  data: object
  level: number
}

export const ObjectRenderer: React.FC<Props> = ({ data, level }) => {
  const [open, setOpen] = useState(false)
  const entries = Object.entries(data)
  const len = entries.length

  return (
    <Block>
      <Block position="absolute" top={8.125} left={level > 0 ? -15 : 0}>
        <Toggle isOpen={open} onClick={() => setOpen(open => !open)} />
      </Block>

      <Block transform={level === 0 ? 'translateX(15px)' : null}>
        {'{...}'}
      </Block>

      {open && (
        <Block paddingLeft={level > 0 ? 5 : 20}>
          {entries.map(([key, value], i) => (
            <Row key={i} position="relative">
              <Block color={colors.slate['700']} fontWeight={700}>
                {key}:
              </Block>
              <Block marginLeft={5}>
                {getRendererForType(value, level + 1)}
              </Block>
              {i < len - 1 && <Block>,</Block>}
            </Row>
          ))}
        </Block>
      )}
    </Block>
  )
}
