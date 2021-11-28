import { createAtom } from '@/utils/state'

export const [$active, getActive, setActive] = createAtom(false)
export const [$picker, getPicker, setPicker] = createAtom(false)
