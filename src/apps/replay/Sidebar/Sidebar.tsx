import { Grid } from 'jsxstyle'
import React, { useState } from 'react'
import { Details } from './Details'
import { Menu } from './Menu'
import { ViewContext, View } from './view'

export const Sidebar: React.FC = () => {
  const [view, setView] = useState(View.Discussion)

  return (
    <ViewContext.Provider value={[view, setView]}>
      <Grid
        gridArea="sidebar"
        gridTemplateColumns="40px auto"
      >
        <Menu />
        <Details />
      </Grid>
    </ViewContext.Provider>
  )
}
