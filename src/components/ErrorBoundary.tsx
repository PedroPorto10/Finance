import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { SafeLocalStorage } from '@/lib/safeLocalStorage';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleClearData = () => {
    if (window.confirm('This will clear all app data. Are you sure?')) {
      SafeLocalStorage.clearAll();
      window.location.reload();
    }
  };

  private handleCleanup = () => {
    SafeLocalStorage.cleanup();
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <CardTitle className="text-xl text-red-800">App Error</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-center text-gray-600">
                The app encountered an error and needs to be restarted. This might be due to corrupted data.
              </p>

              {this.state.error && (
                <details className="bg-gray-100 p-3 rounded text-xs">
                  <summary className="cursor-pointer font-medium">Error Details</summary>
                  <pre className="mt-2 whitespace-pre-wrap">
                    {this.state.error.message}
                  </pre>
                </details>
              )}

              <div className="space-y-2">
                <Button
                  onClick={this.handleReload}
                  className="w-full"
                  variant="default"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reload App
                </Button>

                <Button
                  onClick={this.handleCleanup}
                  className="w-full"
                  variant="outline"
                >
                  Clean & Reload
                </Button>

                <Button
                  onClick={this.handleClearData}
                  className="w-full"
                  variant="destructive"
                >
                  Clear All Data & Reload
                </Button>
              </div>

              <p className="text-xs text-center text-gray-500">
                If the problem persists, contact support
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}