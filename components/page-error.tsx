"use client"

import { ReactNode } from "react"
import { ErrorBoundary } from "@/components/error-boundary"
import { AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PageErrorProps {
  title?: string
  message?: string
  onRetry?: () => void
  children?: ReactNode
}

export function PageError({
  title = "Page Load Error",
  message = "Unable to load this page. Please try again.",
  onRetry,
}: PageErrorProps) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="max-w-md w-full p-8 bg-card rounded-lg border border-border shadow-lg">
        <div className="flex items-center justify-center mb-4">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <h2 className="text-xl font-bold mb-2 text-center">{title}</h2>
        <p className="text-muted-foreground mb-6 text-sm text-center">{message}</p>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => window.location.href = "/"}
            className="flex-1"
          >
            Go Home
          </Button>
          {onRetry && (
            <Button 
              onClick={onRetry}
              className="flex-1"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export function PageErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  )
}
