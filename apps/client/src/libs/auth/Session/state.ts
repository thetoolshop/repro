import { User } from '@repro/domain'
import { createAtom } from '~/utils/state'

export const [$session, setSession, getSession] = createAtom<User | null>(null)
