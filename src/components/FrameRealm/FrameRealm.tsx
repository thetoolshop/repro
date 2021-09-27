import { Block } from 'jsxstyle'
import React, { MutableRefObject, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

export const FrameRealm: React.FC = ({ children }) => {
  const ref = useRef() as MutableRefObject<HTMLIFrameElement>
  const [root, setRoot] = useState<Document | null>(null)

  useEffect(() => {
    if (ref.current) {
      const doc = ref.current.contentDocument

      if (doc) {
        doc.open()
        doc.write('<!doctype html>')
        doc.close()

        const root = document.createElement('html')
        doc.documentElement.remove()
        doc.appendChild(root)

        setRoot(doc)
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
    >
      {root && createPortal(children, root.documentElement)}
    </Block>
  )
}
