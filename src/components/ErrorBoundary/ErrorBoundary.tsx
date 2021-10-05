import React from 'react'

export class ErrorBoundary extends React.Component {
  state = {
    hasError: false,
  }

  static getDerivedStateFromError(err: any) {
    return {
      hasError: true,
    }
  }

  componentDidCatch(err: any, info: any) {
    console.error(err, info) 
  }

  render() {
    if (this.state.hasError) {
      return 'Error!'
    }

    return this.props.children
  }
}
