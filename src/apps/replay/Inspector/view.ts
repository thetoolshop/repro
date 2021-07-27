import { createContext } from 'react'

export enum View {
  Elements,
  Network,
  Console,
}

type ViewAction = [View, (view: View) => void]

export const ViewContext = createContext<ViewAction>([
  View.Elements,
  (_view: View) => undefined
])
