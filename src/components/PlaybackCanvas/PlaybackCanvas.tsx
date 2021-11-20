import { Block } from 'jsxstyle'
import React, { MutableRefObject, useEffect, useRef, useState } from 'react'
import { FrameRealm } from '@/components/FrameRealm'
import { NativeDOMRenderer } from './NativeDOMRenderer'
import { PointerOverlay } from './PointerOverlay'
import { Viewport } from './Viewport'

export const PlaybackCanvas: React.FC = () => {
  const frameRef = useRef() as MutableRefObject<HTMLIFrameElement>
  const [ownerDocument, setOwnerDocument] = useState<Document | null>(null)

  useEffect(() => {
    if (!frameRef.current) {
      setOwnerDocument(null)
      return
    }

    setOwnerDocument(frameRef.current.contentDocument)
  }, [frameRef, setOwnerDocument])

  return (
    <Block gridArea="canvas" overflow="hidden">
      <Viewport>
        <FrameRealm ref={frameRef}>
          <NativeDOMRenderer ownerDocument={ownerDocument} />
        </FrameRealm>

        <PointerOverlay />
      </Viewport>
    </Block>
  )
}
