import { User } from '@repro/domain'
import { createAtom } from '@repro/atom'

export const [$session, setSession, getSession] = createAtom<User | null>(null)
