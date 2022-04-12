import { SyntheticId } from '@/types/common'

export interface TrackedEvent {
  eventId: SyntheticId
  name: string
  time: number
  props: Record<string, string>
}
