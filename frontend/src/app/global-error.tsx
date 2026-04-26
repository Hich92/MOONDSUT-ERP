'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html>
      <body className="flex min-h-screen items-center justify-center bg-background p-8">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-semibold">Une erreur est survenue</h2>
          <p className="text-muted-foreground text-sm">
            L&apos;erreur a été signalée automatiquement.
          </p>
          <button
            onClick={reset}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm"
          >
            Réessayer
          </button>
        </div>
      </body>
    </html>
  )
}
