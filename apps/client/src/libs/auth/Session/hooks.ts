import { useAtomValue } from '~/utils/state'
import { $session } from './state'

export function useSession() {
  return useAtomValue($session)
}
