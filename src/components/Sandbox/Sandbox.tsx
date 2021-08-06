import { Block } from 'jsxstyle'
import React, { MutableRefObject, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

export const Sandbox: React.FC = ({ children }) => {
  const ref = useRef() as MutableRefObject<HTMLIFrameElement>
  const [root, setRoot] = useState<Element | null>(null)

  useEffect(() => {
    if (ref.current) {
      const doc = ref.current.contentDocument

      if (doc) {
        const root = doc.createElement('html')
        doc.documentElement.remove()
        doc.appendChild(root)
        setRoot(root)
      }
    }
  }, [ref, setRoot])

  // TODO merge <html> attributes into root

  return (
    <Block
      component="iframe"
      props={{ ref }}
      border={0}
      width="100%"
      height="100%"
    >{root && createPortal(children, root)}</Block>
  )
}
