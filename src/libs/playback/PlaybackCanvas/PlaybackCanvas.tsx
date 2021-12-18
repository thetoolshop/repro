import { FrameRealm } from '@/components/FrameRealm'
import { Block } from 'jsxstyle'
import React, {
  MutableRefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { NativeDOMRenderer } from './NativeDOMRenderer'
import { PointerOverlay } from './PointerOverlay'
import { FullWidthViewport } from './FullWidthViewport'
import { ScaleToFitViewport } from './ScaleToFitViewport'

interface Props {
  interactive: boolean
  scaling: 'full-width' | 'scale-to-fit'
}

export const PlaybackCanvas: React.FC<Props> = ({ interactive, scaling }) => {
  const frameRef = useRef() as MutableRefObject<HTMLIFrameElement>
  const [ownerDocument, setOwnerDocument] = useState<Document | null>(null)
  const [loaded, setLoaded] = useState(false)

  const onLoad = useCallback(() => setLoaded(true), [setLoaded])

  useEffect(() => {
    if (!frameRef.current) {
      setOwnerDocument(null)
      return
    }

    const contentDocument = frameRef.current.contentDocument
    setOwnerDocument(contentDocument)
  }, [frameRef, setOwnerDocument])

  const viewportContents = (
    <React.Fragment>
      <FrameRealm ref={frameRef}>
        <NativeDOMRenderer ownerDocument={ownerDocument} onLoad={onLoad} />
      </FrameRealm>

      {!interactive && <PointerOverlay />}
    </React.Fragment>
  )

  return (
    <Block overflow="hidden" height="100%" display={loaded ? 'block' : 'none'}>
      {scaling === 'full-width' && (
        <FullWidthViewport>{viewportContents}</FullWidthViewport>
      )}
      {scaling === 'scale-to-fit' && (
        <ScaleToFitViewport>{viewportContents}</ScaleToFitViewport>
      )}
    </Block>
  )
}
