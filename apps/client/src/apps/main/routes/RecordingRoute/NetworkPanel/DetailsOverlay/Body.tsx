import { Block } from 'jsxstyle'
import React from 'react'
import { JSONView } from '~/components/JSONView'

interface Props {
  body: ArrayBuffer
  contentType: string | null
}

const textDecoder = new TextDecoder()

function decode(buf: ArrayBuffer) {
  return textDecoder.decode(buf)
}

function isText(contentType: string) {
  return contentType.startsWith('text/')
}

function isJSON(contentType: string) {
  return contentType.startsWith('application/json')
}

export const Body: React.FC<Props> = ({ body, contentType }) => {
  contentType = contentType || 'text/plain'

  if (isJSON(contentType)) {
    try {
      const data = JSON.parse(decode(body))
      return <JSONView data={data} />
    } catch {}
  }

  if (isText(contentType)) {
    return <Block>{decode(body)}</Block>
  }

  return null
}
