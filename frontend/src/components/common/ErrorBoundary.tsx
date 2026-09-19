import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in component tree:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="wrap" style={{ padding: '80px 0' }}>
          <div className="card" style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
            <h2 style={{ color: 'var(--stop)', marginBottom: 12 }}>An unexpected error occurred</h2>
            <p className="sub" style={{ marginBottom: 24 }}>
              {this.state.error?.message || 'The application encountered an unexpected state.'}
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                className="btn sm"
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
              >
                Reload application
              </button>
              <button
                className="btn sm line"
                onClick={() => {
                  window.location.href = '#/';
                  window.location.reload();
                }}
              >
                Return to home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
