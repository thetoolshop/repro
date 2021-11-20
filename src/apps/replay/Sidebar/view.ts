import { createContext } from 'react'

export enum View {
  Discussion,
  Timeline,
  Settings,
}

type ViewAction = [View, (view: View) => void]

export const ViewContext = createContext<ViewAction>([
  View.Timeline,
  (_view: View) => undefined,
])
