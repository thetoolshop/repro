import { MessagePart, MessagePartType } from '@repro/domain'
import React from 'react'
import { JSONView } from '~/components/JSONView'
import { VNodeRenderer } from './VNodeRenderer'

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
  switch (part.type) {
    case MessagePartType.Node:
      return part.node ? <VNodeRenderer node={part.node} /> : null

    case MessagePartType.Date:
      const data = new Date()
      data.setUTCFullYear(part.year)
      data.setUTCMonth(part.month)
      data.setUTCDate(part.day)
      data.setUTCHours(part.hour)
      data.setUTCMinutes(part.minute + part.timezoneOffset)
      data.setUTCSeconds(part.second)
      data.setUTCMilliseconds(part.millisecond)
      return <JSONView data={data} />

    case MessagePartType.Undefined:
      return <JSONView data={undefined} />

    case MessagePartType.String:
      return <JSONView data={safeParse(part.value)} />
  }
}
