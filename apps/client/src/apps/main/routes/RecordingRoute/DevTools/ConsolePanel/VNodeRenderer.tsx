import { DocTypeR, DocumentR, ElementR, TextR } from '@repro/design'
import { VNode } from '@repro/domain'
import React from 'react'
import {
  isDocTypeVNode,
  isDocumentVNode,
  isElementVNode,
  isTextVNode,
} from '@repro/vdom-utils'

interface Props {
  node: VNode
}

export const VNodeRenderer: React.FC<Props> = ({ node }) => {
  if (isDocTypeVNode(node)) {
    return <DocTypeR node={node} />
  }

  if (isDocumentVNode(node)) {
    return <DocumentR />
  }

  if (isElementVNode(node)) {
    return <ElementR.Open node={node} />
  }

  if (isTextVNode(node)) {
    return <TextR node={node} />
  }

  return null
}
