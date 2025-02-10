import { Block } from '@jsxstyle/react'
import React, {
  MutableRefObject,
  PropsWithChildren,
  useContext,
  useRef,
} from 'react'

const MAX_INT32 = 2 ** 32 - 1

const PortalRootContext = React.createContext<
  MutableRefObject<HTMLElement | null>
>({
  current: null,
})

export const PortalRootProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const root = useRef() as MutableRefObject<HTMLDivElement>

  return (
    <PortalRootContext.Provider value={root}>
      {children}
      <Block
        position="fixed"
        top={0}
        left={0}
        zIndex={MAX_INT32}
        props={{ ref: root }}
      />
    </PortalRootContext.Provider>
  )
}

export function usePortalRoot() {
  const root = useContext(PortalRootContext)
  return root.current ?? null
}
