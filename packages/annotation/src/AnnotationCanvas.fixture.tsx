import { Annotation, SourceEventView } from '@repro/domain'
import { createSourcePlayback, PlaybackProvider } from '@repro/playback'
import { LazyList } from '@repro/std'
import React from 'react'
import { AnnotationCanvas } from './AnnotationCanvas'

const playback = createSourcePlayback(
  new LazyList([], SourceEventView.decode, SourceEventView.encode),
  {}
)

const annotations: Array<Annotation> = []

const Fixture: React.FC = () => (
  <PlaybackProvider playback={playback}>
    <AnnotationCanvas
      time={0}
      annotations={annotations}
      boundingBox={{
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
      }}
    />
  </PlaybackProvider>
)

export default Fixture
