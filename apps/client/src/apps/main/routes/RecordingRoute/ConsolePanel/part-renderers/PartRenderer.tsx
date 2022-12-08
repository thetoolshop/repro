import { MessagePart, MessagePartType } from '@repro/domain'
import React from 'react'
import { BooleanRenderer } from './BooleanRenderer'
import { JSONRenderer } from './JSONRenderer'
import { NullRenderer } from './NullRenderer'
import { NumberRenderer } from './NumberRenderer'
import { StringRenderer } from './StringRenderer'
import { UndefinedRenderer } from './UndefinedRenderer'
// import { VNodeRenderer } from './VNodeRenderer'

function safeParse(value: string) {
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

interface Props {
  part: MessagePart
}

export const PartRenderer: React.FC<Props> = ({ part }) => {
  if (part.type === MessagePartType.Node) {
    // return <VNodeRenderer value={part.nodeId} />
    return null
  }

  const resolvedValue = safeParse(part.value)

  if (resolvedValue === null) {
    return <NullRenderer />
  } else if (resolvedValue === undefined) {
    return <UndefinedRenderer />
  } else if (Array.isArray(resolvedValue)) {
    return <JSONRenderer value={resolvedValue} />
  } else if (typeof resolvedValue === 'boolean') {
    return <BooleanRenderer value={resolvedValue} />
  } else if (typeof resolvedValue === 'number') {
    return <NumberRenderer value={resolvedValue} />
  } else if (typeof resolvedValue === 'string') {
    return <StringRenderer value={resolvedValue} />
  }

  return <StringRenderer value={resolvedValue.toString()} />
}
