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

  componentDidCatch() {
    // TODO: render last good snapshot and highlight failing patch
    console.log(Trace.getLastFrame())
  }

  render() {
    if (this.state.hasError) {
      return 'Error!'
    }

    return this.props.children
  }
}
