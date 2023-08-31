import { createAtom } from '@repro/atom'
import { User } from '@repro/domain'

export const [$session, setSession, getSession] = createAtom<User | null>(null)
