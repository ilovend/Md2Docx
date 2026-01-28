import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[200px] flex-col items-center justify-center rounded-lg border border-red-500/30 bg-red-500/10 p-8">
          <AlertTriangle className="mb-4 h-12 w-12 text-red-500" />
          <h2 className="mb-2 text-lg font-semibold text-red-400">出现错误</h2>
          <p className="mb-4 max-w-md text-center text-sm text-gray-400">
            应用遇到了意外错误。您可以尝试刷新页面或重置组件。
          </p>
          {this.state.error && (
            <details className="mb-4 max-w-lg">
              <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-400">
                错误详情
              </summary>
              <pre className="mt-2 max-h-32 overflow-auto rounded bg-[#1a1d2e] p-2 text-xs text-red-300">
                {this.state.error.message}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}
          <div className="flex gap-2">
            <button
              onClick={this.handleReset}
              className="flex items-center gap-2 rounded bg-blue-600 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-700"
            >
              <RefreshCw className="h-4 w-4" />
              重试
            </button>
            <button
              onClick={() => window.location.reload()}
              className="rounded border border-gray-600 px-4 py-2 text-sm text-gray-300 transition-colors hover:bg-gray-700"
            >
              刷新页面
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
