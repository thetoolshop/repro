import React from 'react'
import { colors } from '~/config/theme'
import { ArrayRenderer } from './ArrayRenderer'
import { BooleanRenderer } from './BooleanRenderer'
import { NullRenderer } from './NullRenderer'
import { NumberRenderer } from './NumberRenderer'
import { ObjectRenderer } from './ObjectRenderer'
import { StringRenderer } from './StringRenderer'
import { UndefinedRenderer } from './UndefinedRenderer'

export function getRendererForType(data: any, level: number) {
  if (data === undefined) {
    return <UndefinedRenderer />
  } else if (data === null) {
    return <NullRenderer />
  } else if (Array.isArray(data)) {
    return <ArrayRenderer data={data} level={level} />
  } else if (typeof data === 'object') {
    return <ObjectRenderer data={data} level={level} />
  } else if (typeof data === 'number') {
    return <NumberRenderer data={data} />
  } else if (typeof data === 'boolean') {
    return <BooleanRenderer data={data} />
  } else {
    const value = level > 0 ? `"${data.toString()}"` : data.toString()
    const color = level > 0 ? colors.rose['700'] : colors.slate['800']
    return <StringRenderer data={value} color={color} />
  }
}
