import { Row } from 'jsxstyle'
import React, { useState } from 'react'
import { Details } from './Details'
import { ViewContext, View } from './view'

export const Sidebar: React.FC = () => {
  const [view, setView] = useState(View.Timeline)

  return (
    <ViewContext.Provider value={[view, setView]}>
      {/*
      <Grid
        gridArea="sidebar"
        gridTemplateColumns="40px auto"
      >
        <Menu />
      */}
      <Row gridArea="sidebar" alignItems="stretch">
        <Details />
      </Row>
    </ViewContext.Provider>
  )
}
