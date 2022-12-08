import React, { Fragment } from 'react'

interface Props {
  value: object | Array<any>
}

export const JSONRenderer: React.FC<Props> = ({ value }) => (
  <Fragment>{JSON.stringify(value, undefined, 2)}</Fragment>
)
