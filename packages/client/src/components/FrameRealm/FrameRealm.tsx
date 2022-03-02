import { Block } from 'jsxstyle'
import React, { MutableRefObject, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import mergeRefs from 'react-merge-refs'

type Props = React.HTMLProps<HTMLIFrameElement>

// Bypass trusted-types CSP when writing doctype
const passthroughHTMLPolicy =
  window.trustedTypes && window.trustedTypes.createPolicy
    ? window.trustedTypes.createPolicy('passthrough-html', {
        createHTML: html => html,
      })
    : null

function createTrustedHTMLIfSupported(html: string) {
  return passthroughHTMLPolicy ? passthroughHTMLPolicy.createHTML(html) : html
}

export const FrameRealm = React.forwardRef<HTMLIFrameElement, Props>(
  ({ children, ...props }, outerRef) => {
    const innerRef = useRef() as MutableRefObject<HTMLIFrameElement>
    const ref = mergeRefs([innerRef, outerRef])
    const [root, setRoot] = useState<Document | null>(null)

    useEffect(() => {
      if (innerRef && innerRef.current) {
        const doc = innerRef.current.contentDocument

        if (doc) {
          doc.open()
          // The type for Document.write sink in lib.dom does not currently
          // support passing TrustedHTML object. Cast as string to keep
          // the type-checker happy.
          doc.write(createTrustedHTMLIfSupported('<!doctype html>') as string)
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
        props={{ ref, ...props }}
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
