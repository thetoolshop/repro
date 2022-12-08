import { VNode } from '@repro/domain'
import React, { Fragment } from 'react'

interface Props {
  value: VNode
}

export const VNodeRenderer: React.FC<Props> = ({ value }) => (
  <Fragment>{value.id}</Fragment>
)
