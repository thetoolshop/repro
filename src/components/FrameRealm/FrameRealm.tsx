import { Block } from 'jsxstyle'
import React, { MutableRefObject, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import mergeRefs from 'react-merge-refs'

type Props = React.HTMLProps<HTMLIFrameElement>

export const FrameRealm = React.forwardRef<HTMLIFrameElement, Props>(
  ({ children }, outerRef) => {
    const innerRef = useRef() as MutableRefObject<HTMLIFrameElement>
    const ref = mergeRefs([innerRef, outerRef])
    const [root, setRoot] = useState<Document | null>(null)

    useEffect(() => {
      if (innerRef && innerRef.current) {
        const doc = innerRef.current.contentDocument

        if (doc) {
          doc.open()
          doc.write('<!doctype html>')
          doc.close()

          doc.domain = document.domain

          const root = document.createElement('html')
          doc.documentElement.remove()
          doc.appendChild(root)

          setRoot(doc)
        }
      }
    }, [innerRef, setRoot])

    // TODO merge <html> attributes into root

    return (
      <Block
        component="iframe"
        props={{ ref }}
        border={0}
        width="100%"
        height="100%"
        overflow="hidden"
      >
        {root && createPortal(children, root.documentElement)}
      </Block>
    )
  }
)
