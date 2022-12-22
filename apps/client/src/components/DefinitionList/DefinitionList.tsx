import { Block, Grid } from 'jsxstyle'
import React, { Fragment } from 'react'

interface Props {
  entries: Array<[string, string | null]>
}

export const DefinitionList: React.FC<Props> = ({ entries }) => (
  <Grid gridTemplateColumns="1fr 3fr" gap={10} fontSize={13}>
    {entries.map(([key, value]) =>
      value !== null ? (
        <Fragment key={key}>
          <Block fontWeight={700}>{key}</Block>
          <Block>{value}</Block>
        </Fragment>
      ) : null
    )}
  </Grid>
)
