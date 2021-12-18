import { SyntheticId } from '@/types/common'
import { DOMPatchEvent, SourceEvent, SourceEventType } from '@/types/recording'
import { copyObject } from '@/utils/lang'
import React, { useEffect, useState } from 'react'
import { usePlayback } from '../hooks'

function isDOMPatchEvent(event: SourceEvent): event is DOMPatchEvent {
  return event.type === SourceEventType.DOMPatch
}

export const ElementTree: React.FC = () => {
  const playback = usePlayback()

  return null
}
