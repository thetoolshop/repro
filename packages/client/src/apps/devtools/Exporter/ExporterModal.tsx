import React, { useEffect } from 'react'
import { Modal } from '@/components/Modal'
import { Block } from 'jsxstyle'
import { MAX_INT32 } from '../constants'
import { Shortcuts } from 'shortcuts'

interface Props {
  onClose(): void
}

export const ExporterModal: React.FC<Props> = ({ onClose }) => {
  useEffect(() => {
    const shortcuts = new Shortcuts()

    shortcuts.add({
      shortcut: 'Escape',
      handler: onClose,
    })

    return () => {
      shortcuts.reset()
    }
  }, [onClose])

  return (
    <Block isolation="isolate" zIndex={MAX_INT32}>
      <Modal width="80vw" height="80vh" onClose={onClose} />
    </Block>
  )
}
