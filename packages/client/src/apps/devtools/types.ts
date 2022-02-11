import { SyntheticId } from '@/types/common'

export type Snap = 'bottom' | 'right'

export enum View {
  Elements,
  Network,
  Performance,
  Console,
  Settings,
}

export type MutableNodeMap = Record<SyntheticId, Node>
