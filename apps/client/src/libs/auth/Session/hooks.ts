import { useAtomValue } from '@repro/atom'
import { $session } from './state'

export function useSession() {
  return useAtomValue($session)
}
