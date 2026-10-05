import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('React Component Error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-6 select-none">
          <div className="max-w-xl w-full bg-[var(--surface)] border border-red-500/30 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[var(--text-primary)]">Something went wrong loading this page.</h2>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  An unexpected React component error occurred during rendering.
                </p>
              </div>
            </div>

            {this.state.error && (
              <div className="p-4 bg-red-500/5 rounded-xl border border-red-500/20 text-xs font-mono text-red-700 dark:text-red-300 overflow-x-auto space-y-2">
                <p className="font-bold">{this.state.error.toString()}</p>
                {this.state.errorInfo?.componentStack && (
                  <pre className="text-[11px] opacity-80 whitespace-pre-wrap max-h-48 overflow-y-auto">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-[var(--primary)] text-white hover:opacity-90 flex items-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" /> Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
