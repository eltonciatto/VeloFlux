// 🚀 Error Boundary Avançado para Produção
// Tratamento robusto de erros com retry, logging e fallbacks

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, Bug, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showErrorDetails?: boolean;
  maxRetries?: number;
  retryDelay?: number;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
  isRetrying: boolean;
  showDetails: boolean;
  errorId: string;
}

export class AdvancedErrorBoundary extends Component<Props, State> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRetrying: false,
      showDetails: false,
      errorId: this.generateErrorId()
    };
  }

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { 
      hasError: true, 
      error,
      errorId: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // Log error to monitoring service
    this.logError(error, errorInfo);

    // Call custom error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private logError = (error: Error, errorInfo: ErrorInfo) => {
    const errorReport = {
      id: this.state.errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: 'anonymous', // Replace with actual user ID
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Error Boundary Caught Error');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Full Report:', errorReport);
      console.groupEnd();
    }

    // Send to monitoring service (e.g., Sentry, LogRocket)
    try {
      // Example: Sentry.captureException(error, { contexts: { errorInfo } });
      // Example: LogRocket.captureException(error);
      
      // For now, store in localStorage for debugging
      const existingErrors = JSON.parse(localStorage.getItem('dashboard_errors') || '[]');
      existingErrors.push(errorReport);
      // Keep only last 10 errors
      localStorage.setItem('dashboard_errors', JSON.stringify(existingErrors.slice(-10)));
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
  };

  private handleRetry = () => {
    const { maxRetries = 3, retryDelay = 1000 } = this.props;
    
    if (this.state.retryCount >= maxRetries) {
      return;
    }

    this.setState({ isRetrying: true });

    this.retryTimeoutId = setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: this.state.retryCount + 1,
        isRetrying: false,
        errorId: this.generateErrorId()
      });
    }, retryDelay);
  };

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRetrying: false,
      showDetails: false,
      errorId: this.generateErrorId()
    });
  };

  private toggleDetails = () => {
    this.setState({ showDetails: !this.state.showDetails });
  };

  private reportBug = () => {
    const { error, errorInfo, errorId } = this.state;
    const subject = encodeURIComponent(`Bug Report: ${error?.message || 'Unknown Error'}`);
    const body = encodeURIComponent(`
Error ID: ${errorId}
Error: ${error?.message || 'Unknown'}
Stack: ${error?.stack || 'No stack trace'}
Component Stack: ${errorInfo?.componentStack || 'No component stack'}
Timestamp: ${new Date().toISOString()}
URL: ${window.location.href}
User Agent: ${navigator.userAgent}

Steps to reproduce:
1. 
2. 
3. 

Expected behavior:


Actual behavior:

    `);
    
    window.open(`mailto:bugs@veloflux.io?subject=${subject}&body=${body}`);
  };

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  render() {
    if (this.state.hasError) {
      const { maxRetries = 3 } = this.props;
      const canRetry = this.state.retryCount < maxRetries;

      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6"
        >
          <Card className="border-red-200 bg-red-50/10">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                  Component Error
                </CardTitle>
                <Badge variant="destructive">
                  Error #{this.state.errorId.slice(-6)}
                </Badge>
              </div>
              <CardDescription>
                Something went wrong in this component. We've logged the error and you can try again.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Error Message */}
              <Alert className="border-red-200">
                <Bug className="h-4 w-4" />
                <AlertDescription>
                  <strong>Error:</strong> {this.state.error?.message || 'Unknown error occurred'}
                </AlertDescription>
              </Alert>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 flex-wrap">
                {canRetry && (
                  <Button
                    onClick={this.handleRetry}
                    disabled={this.state.isRetrying}
                    className="flex items-center gap-2"
                    variant="outline"
                  >
                    {this.state.isRetrying ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    {this.state.isRetrying ? 'Retrying...' : `Retry (${maxRetries - this.state.retryCount} left)`}
                  </Button>
                )}

                <Button
                  onClick={this.handleReset}
                  variant="default"
                  className="flex items-center gap-2"
                >
                  Reset Component
                </Button>

                <Button
                  onClick={this.reportBug}
                  variant="ghost"
                  className="flex items-center gap-2 text-red-600 hover:text-red-700"
                >
                  <ExternalLink className="h-4 w-4" />
                  Report Bug
                </Button>

                {this.props.showErrorDetails !== false && (
                  <Button
                    onClick={this.toggleDetails}
                    variant="ghost"
                    className="flex items-center gap-2"
                  >
                    {this.state.showDetails ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                    {this.state.showDetails ? 'Hide' : 'Show'} Details
                  </Button>
                )}
              </div>

              {/* Error Details (Collapsible) */}
              {this.state.showDetails && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-3"
                >
                  <div className="bg-slate-900 p-4 rounded-lg text-sm font-mono">
                    <div className="text-red-400 mb-2">Stack Trace:</div>
                    <pre className="text-slate-300 whitespace-pre-wrap overflow-x-auto">
                      {this.state.error?.stack}
                    </pre>
                  </div>

                  {this.state.errorInfo && (
                    <div className="bg-slate-900 p-4 rounded-lg text-sm font-mono">
                      <div className="text-yellow-400 mb-2">Component Stack:</div>
                      <pre className="text-slate-300 whitespace-pre-wrap overflow-x-auto">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}

                  <div className="text-xs text-slate-500 space-y-1">
                    <div>Error ID: {this.state.errorId}</div>
                    <div>Retry Count: {this.state.retryCount}/{maxRetries}</div>
                    <div>Timestamp: {new Date().toISOString()}</div>
                    <div>URL: {window.location.href}</div>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for easier usage
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = React.forwardRef<any, P>((props, ref) => (
    <AdvancedErrorBoundary {...errorBoundaryProps}>
      <Component {...props} ref={ref} />
    </AdvancedErrorBoundary>
  ));

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

// Hook for programmatic error handling
export function useErrorHandler() {
  const handleError = React.useCallback((error: Error, errorInfo?: { componentStack?: string }) => {
    // This would throw the error to the nearest error boundary
    throw error;
  }, []);

  return handleError;
}
