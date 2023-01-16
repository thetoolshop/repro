import { Grid } from 'jsxstyle'
import { Loader as LoaderIcon } from 'lucide-react'
import React from 'react'
import * as FX from '~/components/FX'

export const Loading: React.FC = () => (
  <Grid height="calc(100vh - 90px)" alignItems="center" justifyItems="center">
    <FX.Spin>
      <LoaderIcon />
    </FX.Spin>
  </Grid>
)
