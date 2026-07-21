import { Component } from 'react';

export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Unhandled render error:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <main className="container" style={{ maxWidth: 560 }}>
          <div className="card" style={{ borderColor: 'var(--danger)' }}>
            <h3>Something went wrong</h3>
            <p className="muted" style={{ margin: '10px 0 18px' }}>
              This page hit an unexpected error. Reloading usually fixes it.
            </p>
            <button className="btn" onClick={() => window.location.reload()}>Reload</button>
          </div>
        </main>
      );
    }
    return this.props.children;
  }
}
