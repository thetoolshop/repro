import { logger } from '@repro/logger'
import React, { PropsWithChildren } from 'react'
import { Trace } from '~/libs/diagnostics'

export class PlaybackErrorBoundary extends React.Component<PropsWithChildren> {
  state = {
    hasError: false,
    error: null,
  }

  static getDerivedStateFromError(err: any) {
    return {
      hasError: true,
      error: err,
    }
  }

  componentDidCatch() {
    // TODO: render last good snapshot and highlight failing patch
    logger.log(Trace.getLastFrame())
  }

  render() {
    if (this.state.hasError) {
      return 'Error!'
    }

    return this.props.children
  }
}
