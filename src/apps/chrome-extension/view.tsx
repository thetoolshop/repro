import React, { useContext, useState } from 'react'

export enum View {
  Idle,
  Record,
  Preview,
  Confirm,
}

const ViewContext = React.createContext({
  view: View.Idle,
  setView: (_view: View) => {},
})

export function useView() {
  return useContext(ViewContext)
}

export const ViewProvider: React.FC = ({ children }) => {
  const [view, setView] = useState(View.Idle)

  return (
    <ViewContext.Provider value={{ view, setView }}>
      {children}
    </ViewContext.Provider>
  )
}
