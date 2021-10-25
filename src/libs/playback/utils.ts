import { Sample } from '@/types/recording'

export function isSample(event: object): event is Sample<any> {
  return 'from' in event && 'to' in event && 'duration' in event
}
