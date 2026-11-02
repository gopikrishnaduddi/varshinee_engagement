import { Component, type ReactNode } from 'react'

/** If the 3D world throws, quietly swap to the illustrated fallback — the invitation must always work */
export class SceneErrorBoundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: unknown) {
    console.warn('[invitation] 3D scene unavailable, using the illustrated temple instead.', error)
    this.props.onError()
  }

  render() {
    return this.state.failed ? null : this.props.children
  }
}
