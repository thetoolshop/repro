import { MessagePart, MessagePartType } from '@repro/domain'
import React from 'react'
import { JSONView } from '~/components/JSONView'
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

  return <JSONView data={safeParse(part.value)} />
}
