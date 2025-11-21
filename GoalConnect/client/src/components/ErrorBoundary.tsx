import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * ErrorBoundary component to catch React rendering errors
 * Prevents entire app crash from single component failures
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console
    console.error('[ErrorBoundary] Caught error:', error);
    console.error('[ErrorBoundary] Error info:', errorInfo);

    // Log to external service (can be extended to use Sentry, LogRocket, etc.)
    this.logErrorToService(error, errorInfo);

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Update state with error details
    this.setState({
      error,
      errorInfo,
    });
  }

  logErrorToService(error: Error, errorInfo: ErrorInfo) {
    // This would integrate with error tracking services like Sentry
    // For now, we'll just structure the log nicely
    const errorLog = {
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    console.error('[ErrorBoundary] Error log:', JSON.stringify(errorLog, null, 2));

    // TODO: Send to error tracking service
    // Example: Sentry.captureException(error, { contexts: { react: errorInfo } });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    // Optionally reload the page
    // window.location.reload();
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const isDevelopment = import.meta.env.DEV;
      const { error, errorInfo } = this.state;
      const fallbackMessage = this.props.fallbackMessage || 'Something went wrong';

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          <Card className="max-w-2xl w-full bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-2xl text-red-400 flex items-center gap-2">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                {fallbackMessage}
              </CardTitle>
              <CardDescription className="text-slate-300">
                We've encountered an unexpected error. Don't worry, your data is safe.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isDevelopment && error && (
                <div className="space-y-2">
                  <div className="bg-slate-900/50 p-4 rounded-md border border-red-900/50">
                    <p className="text-sm font-mono text-red-300 font-semibold mb-2">
                      {error.name}: {error.message}
                    </p>
                    {error.stack && (
                      <pre className="text-xs text-slate-400 overflow-x-auto whitespace-pre-wrap">
                        {error.stack}
                      </pre>
                    )}
                  </div>
                  {errorInfo?.componentStack && (
                    <details className="bg-slate-900/50 p-4 rounded-md border border-slate-700">
                      <summary className="text-sm font-semibold text-slate-300 cursor-pointer">
                        Component Stack
                      </summary>
                      <pre className="text-xs text-slate-400 overflow-x-auto whitespace-pre-wrap mt-2">
                        {errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              {!isDevelopment && (
                <div className="bg-slate-900/50 p-4 rounded-md border border-slate-700">
                  <p className="text-sm text-slate-300">
                    An error occurred while displaying this page. Please try refreshing or contact
                    support if the problem persists.
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button onClick={this.handleReset} variant="outline" className="flex-1">
                  Try Again
                </Button>
                <Button onClick={this.handleReload} variant="default" className="flex-1">
                  Reload Page
                </Button>
              </div>

              {isDevelopment && (
                <p className="text-xs text-slate-500 text-center">
                  This detailed error information is only shown in development mode
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
