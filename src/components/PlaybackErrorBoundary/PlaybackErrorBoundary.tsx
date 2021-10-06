import React from 'react'
import { Trace } from '@/libs/diagnostics'

export class PlaybackErrorBoundary extends React.Component {
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

  render() {
    // TODO: render last good snapshot and highlight failing patch
    console.log(Trace.getLastFrame())

    if (this.state.hasError) {
      return 'Error!'
    }

    return this.props.children
  }
}
