import { Component } from 'react';
import { Button } from '@/components/ui/Button';

export class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Application error boundary caught an error', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center p-6">
          <div className="max-w-md rounded-[28px] border border-border bg-card p-8 text-center shadow-soft">
            <h2 className="text-2xl font-bold">Something went wrong</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              The page hit an unexpected error. Refresh to try again.
            </p>
            <Button className="mt-6" onClick={() => window.location.reload()}>
              Reload app
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
