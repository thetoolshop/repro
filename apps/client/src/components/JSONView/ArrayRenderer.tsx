import { Block, Row } from 'jsxstyle'
import React, { useState } from 'react'
import { colors } from '~/config/theme'
import { getRendererForType } from './getRendererForType'
import { Toggle } from './Toggle'

interface Props {
  data: Array<any>
  level: number
}

export const ArrayRenderer: React.FC<Props> = ({ data, level }) => {
  const [open, setOpen] = useState(false)

  return (
    <Block paddingRight={level === 0 ? 15 : 0}>
      <Block position="absolute" top={8.125} left={level > 0 ? -15 : 0}>
        <Toggle isOpen={open} onClick={() => setOpen(open => !open)} />
      </Block>

      <Block transform={level === 0 ? 'translateX(15px)' : null}>
        Array({data.length})
      </Block>

      {open && (
        <Block paddingLeft={level > 0 ? 5 : 20}>
          {data.map((item, i) => (
            <Row key={i} position="relative">
              <Block color={colors.slate['500']}>{i}:</Block>
              <Block marginLeft={5}>
                {getRendererForType(item, level + 1)}
              </Block>
            </Row>
          ))}
        </Block>
      )}
    </Block>
  )
}
