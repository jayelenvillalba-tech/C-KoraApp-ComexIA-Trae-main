import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error in ErrorBoundary:", error, errorInfo);
    this.setState({ errorInfo });
    
    // Here we could send the error to a logging service in the future
    // if (typeof Sentry !== 'undefined') {
    //   Sentry.captureException(error);
    // }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[var(--ds-bg-base)] flex items-center justify-center p-4 text-[var(--ds-text-primary)]">
          <Card className="max-w-lg w-full bg-[var(--ds-bg-raised)] border border-[var(--ds-red)]/30 shadow-2xl">
            <CardContent className="pt-8 pb-8 px-6 text-center space-y-6">
              <div className="mx-auto w-16 h-16 rounded-full bg-[var(--ds-red)]/10 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-[var(--ds-red)]" />
              </div>
              
              <div className="space-y-2">
                <h2 className="font-display text-2xl font-bold tracking-tight text-white">
                  Sistema Interrumpido
                </h2>
                <p className="font-body text-sm text-[var(--ds-text-secondary)] leading-relaxed">
                  Ha ocurrido un error inesperado en la interfaz. Nuestros sistemas de diagnóstico ya han registrado el incidente para su revisión.
                </p>
              </div>

              {/* Technical details accordion (optional) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="mt-4 p-4 bg-black/40 rounded-lg text-left overflow-hidden">
                  <p className="font-data text-xs text-[var(--ds-red)] mb-2 font-bold break-all">
                    {this.state.error.toString()}
                  </p>
                  <pre className="font-data text-[10px] text-[var(--ds-text-muted)] overflow-x-auto whitespace-pre-wrap">
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-4 justify-center">
                <Button 
                  onClick={this.handleReset}
                  className="bg-[var(--ds-cyan)] hover:bg-[var(--ds-cyan)]/90 text-black font-bold flex items-center justify-center"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reiniciar Sesión
                </Button>
                <Button 
                  variant="outline" 
                  onClick={this.handleGoHome}
                  className="border-[var(--ds-border-subtle)] hover:bg-[var(--ds-bg-overlay)] flex items-center justify-center"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Volver al Inicio
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
