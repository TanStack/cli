/**
 * FILE OVERVIEW:
 * Purpose: Interactive demo page showcasing Sentry's monitoring capabilities
 * Key Concepts: Error tracking, Performance monitoring, Session replay
 * Module Type: Route Component
 * @ai_context: Demonstrates Sentry features through interactive examples with educational context
 */

import * as fs from 'node:fs/promises'
import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import * as Sentry from '@sentry/tanstackstart-react'
import { useState, useEffect } from 'react'

export const Route = createFileRoute('/demo/sentry/testing')({
  component: RouteComponent,
  errorComponent: ({ error }) => {
    useEffect(() => {
      Sentry.captureException(error)
    }, [error])
    return (
      <main className="demo-page demo-center">
        <section className="demo-panel text-center">
          <SentryLogo />
          <h1 className="mt-4 mb-2 text-2xl font-bold">Something went wrong</h1>
          <p className="demo-muted">{error.message}</p>
        </section>
      </main>
    )
  },
})

// Sentry Logo Component
function SentryLogo({ size = 48 }: { size?: number }) {
  return (
    <svg
      height={size}
      width={size}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 40 40"
    >
      <path
        d="M21.85 2.995a3.698 3.698 0 0 1 1.353 1.354l16.303 28.278a3.703 3.703 0 0 1-1.354 5.053 3.694 3.694 0 0 1-1.848.496h-3.828a31.149 31.149 0 0 0 0-3.09h3.815a.61.61 0 0 0 .537-.917L20.523 5.893a.61.61 0 0 0-1.057 0l-3.739 6.494a28.948 28.948 0 0 1 9.63 10.453 28.988 28.988 0 0 1 3.499 13.78v1.542h-9.852v-1.544a19.106 19.106 0 0 0-2.182-8.85 19.08 19.08 0 0 0-6.032-6.829l-1.85 3.208a15.377 15.377 0 0 1 6.382 12.484v1.542H3.696A3.694 3.694 0 0 1 0 34.473c0-.648.17-1.286.494-1.849l2.33-4.074a8.562 8.562 0 0 1 2.689 1.536L3.158 34.17a.611.611 0 0 0 .538.917h8.448a12.481 12.481 0 0 0-6.037-9.09l-1.344-.772 4.908-8.545 1.344.77a22.16 22.16 0 0 1 7.705 7.444 22.193 22.193 0 0 1 3.316 10.193h3.699a25.892 25.892 0 0 0-3.811-12.033 25.856 25.856 0 0 0-9.046-8.796l-1.344-.772 5.269-9.136a3.698 3.698 0 0 1 3.2-1.849c.648 0 1.285.17 1.847.495Z"
        fill="currentColor"
      />
    </svg>
  )
}

// Server function that will error
const badServerFunc = createServerFn({
  method: 'GET',
}).handler(async () => {
  return await Sentry.startSpan(
    {
      name: 'Reading non-existent file',
      op: 'file.read',
    },
    async () => {
      try {
        await fs.readFile('./doesnt-exist', 'utf-8')
        return true
      } catch (error) {
        Sentry.captureException(error)
        throw error
      }
    },
  )
})

// Server function that will succeed but be traced
const goodServerFunc = createServerFn({
  method: 'GET',
}).handler(async () => {
  return await Sentry.startSpan(
    {
      name: 'Successful server operation',
      op: 'demo.success',
    },
    async () => {
      await new Promise((resolve) => setTimeout(resolve, 500))
      return { success: true }
    },
  )
})

// 3D Button Component inspired by Sentry wizard
function SentryButton({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  loading = false,
}: {
  children: React.ReactNode
  onClick: () => void
  variant?: 'primary' | 'error'
  disabled?: boolean
  loading?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={`demo-button w-full px-6 py-4 text-base ${variant === 'error' ? 'demo-button-danger' : ''}`}
    >
      {loading && (
        <svg
          className="animate-spin h-5 w-5"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  )
}

// Feature Card Component
function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="demo-card transition-all group">
      <div className="flex items-center gap-3 mb-2">
        <div className="text-[var(--lagoon-deep)] group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <h3 className="font-semibold text-[var(--sea-ink)]">{title}</h3>
      </div>
      <p className="demo-muted pl-9 text-sm">{description}</p>
    </div>
  )
}

// Result Badge Component
function ResultBadge({
  type,
  spanOp,
  onCopy,
}: {
  type: 'success' | 'error'
  spanOp: string
  onCopy: () => void
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(spanOp)
    setCopied(true)
    onCopy()
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="mt-4 space-y-3">
      {type === 'error' && (
        <div className="demo-alert demo-alert-danger flex items-center gap-2">
          <svg
            className="w-5 h-5 text-[#9f3030]"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <title>Error captured</title>
            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="text-sm font-medium">
            Error captured and sent to Sentry
          </span>
        </div>
      )}

      {type === 'success' && (
        <div className="demo-alert flex items-center gap-2">
          <svg
            className="w-5 h-5 text-[var(--palm)]"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <title>Trace complete</title>
            <path d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-sm font-medium">
            Trace completed successfully
          </span>
        </div>
      )}

      <button
        type="button"
        onClick={handleCopy}
        className="demo-list-item relative flex items-center gap-2 transition-all cursor-pointer w-full"
      >
        <span className="demo-muted text-sm">span.op:</span>
        <code className="font-mono text-sm">{spanOp}</code>
        <svg
          className="w-4 h-4 demo-muted ml-auto"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <title>Copy to clipboard</title>
          <path d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        {copied && (
          <span className="demo-pill absolute -top-8 left-1/2 -translate-x-1/2 animate-pulse">
            Copied!
          </span>
        )}
      </button>
    </div>
  )
}

// Progress Bar Component
function ProgressBar({ loading }: { loading: boolean }) {
  return (
    <div className="mt-4 flex items-center gap-3">
      <div
        className={`w-3 h-3 rounded-full transition-all ${loading ? 'bg-[var(--lagoon)] animate-pulse' : 'bg-[var(--palm)]'}`}
      />
      <div className="flex-1 h-2 bg-[var(--line)] rounded-full overflow-hidden">
        <div
          className="h-full bg-[var(--lagoon)] rounded-full transition-all duration-500"
          style={{ width: loading ? '60%' : '100%' }}
        />
      </div>
      <span className="demo-muted text-xs w-16 text-right">
        {loading ? 'Running...' : 'Complete'}
      </span>
    </div>
  )
}

function RouteComponent() {
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({})
  const [results, setResults] = useState<
    Record<string, { type: 'success' | 'error'; spanOp: string }>
  >({})
  const [sentryConfigured, setSentryConfigured] = useState<boolean | null>(null)

  useEffect(() => {
    // Check if Sentry DSN environment variable is set
    const hasDsn = !!import.meta.env.VITE_SENTRY_DSN
    setSentryConfigured(hasDsn)
  }, [])

  // Don't show warning until we've checked on the client
  const showWarning = sentryConfigured === false

  const handleClientError = async () => {
    setIsLoading((prev) => ({ ...prev, clientError: true }))
    try {
      await Sentry.startSpan(
        { name: 'Client Error Flow Demo', op: 'demo.client-error' },
        async () => {
          Sentry.setContext('demo', {
            feature: 'client-error-demo',
            triggered_at: new Date().toISOString(),
          })
          throw new Error('Client-side error demonstration')
        },
      )
    } catch (error) {
      Sentry.captureException(error)
      setResults((prev) => ({
        ...prev,
        clientError: { type: 'error', spanOp: 'demo.client-error' },
      }))
    } finally {
      setIsLoading((prev) => ({ ...prev, clientError: false }))
    }
  }

  const handleServerError = async () => {
    setIsLoading((prev) => ({ ...prev, serverError: true }))
    try {
      await Sentry.startSpan(
        { name: 'Server Error Flow Demo', op: 'demo.server-error' },
        async () => {
          Sentry.setContext('demo', {
            feature: 'server-error-demo',
            triggered_at: new Date().toISOString(),
          })
          await badServerFunc()
        },
      )
    } catch (error) {
      Sentry.captureException(error)
      setResults((prev) => ({
        ...prev,
        serverError: { type: 'error', spanOp: 'demo.server-error' },
      }))
    } finally {
      setIsLoading((prev) => ({ ...prev, serverError: false }))
    }
  }

  const handleClientTrace = async () => {
    setIsLoading((prev) => ({ ...prev, clientTrace: true }))
    await Sentry.startSpan(
      { name: 'Client Operation', op: 'demo.client-trace' },
      async () => {
        await new Promise((resolve) => setTimeout(resolve, 1000))
      },
    )
    setResults((prev) => ({
      ...prev,
      clientTrace: { type: 'success', spanOp: 'demo.client-trace' },
    }))
    setIsLoading((prev) => ({ ...prev, clientTrace: false }))
  }

  const handleServerTrace = async () => {
    setIsLoading((prev) => ({ ...prev, serverTrace: true }))
    try {
      await Sentry.startSpan(
        { name: 'Server Operation', op: 'demo.server-trace' },
        async () => {
          await goodServerFunc()
        },
      )
      setResults((prev) => ({
        ...prev,
        serverTrace: { type: 'success', spanOp: 'demo.server-trace' },
      }))
    } finally {
      setIsLoading((prev) => ({ ...prev, serverTrace: false }))
    }
  }

  return (
    <main className="demo-page demo-page-wide">
      <div className="mx-auto max-w-5xl">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-4 mb-8">
            <div className="text-[var(--lagoon-deep)]">
              <SentryLogo size={56} />
            </div>
            <div className="text-left">
              <h1 className="demo-title">Sentry Demo</h1>
              <p className="demo-muted text-sm">
                Error monitoring & performance tracing
              </p>
            </div>
          </div>
          <p className="demo-muted mx-auto max-w-xl text-lg leading-relaxed">
            Click the buttons below to trigger errors and traces, then view them
            in your{' '}
            <a
              href="https://sentry.io"
              target="_blank"
              rel="noopener noreferrer"
            >
              Sentry dashboard
            </a>
            .
          </p>
        </div>

        {/* Sentry Not Initialized Warning */}
        {showWarning && (
          <div className="demo-alert mb-8 flex items-center gap-3">
            <svg
              className="w-6 h-6 text-[var(--sea-ink-soft)] flex-shrink-0"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <title>Warning</title>
              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="font-medium">Sentry is not initialized</p>
              <p className="demo-muted text-sm mt-1">
                Set the <code>VITE_SENTRY_DSN</code> environment variable to
                enable error tracking and performance monitoring.
              </p>
            </div>
          </div>
        )}

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
          <FeatureCard
            icon={
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
            }
            title="Error Monitoring"
            description="Client & server error tracking"
          />
          <FeatureCard
            icon={
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13 3v18h-2V3h2zm6 6v12h-2V9h2zM7 14v7H5v-7h2z" />
              </svg>
            }
            title="Performance"
            description="Tracing and spans visualization"
          />
          <FeatureCard
            icon={
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
              </svg>
            }
            title="Session Replay"
            description="Real user session playback"
          />
          <FeatureCard
            icon={
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
              </svg>
            }
            title="Real-time Alerts"
            description="Instant issue notifications"
          />
        </div>

        {/* Testing Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Client-Side Panel */}
          <div className="demo-panel">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-3 h-3 rounded-full bg-[var(--palm)]" />
              <h2 className="demo-section-title">Client-Side Testing</h2>
            </div>

            <div className="space-y-4">
              <div>
                <SentryButton
                  variant="error"
                  onClick={handleClientError}
                  loading={isLoading.clientError}
                  disabled={sentryConfigured === false}
                >
                  Trigger Client Error
                </SentryButton>
                {isLoading.clientError && (
                  <ProgressBar loading={isLoading.clientError} />
                )}
                {results.clientError && !isLoading.clientError && (
                  <ResultBadge
                    type={results.clientError.type}
                    spanOp={results.clientError.spanOp}
                    onCopy={() => {}}
                  />
                )}
              </div>

              <div>
                <SentryButton
                  variant="primary"
                  onClick={handleClientTrace}
                  loading={isLoading.clientTrace}
                  disabled={sentryConfigured === false}
                >
                  Test Client Trace
                </SentryButton>
                {isLoading.clientTrace && (
                  <ProgressBar loading={isLoading.clientTrace} />
                )}
                {results.clientTrace && !isLoading.clientTrace && (
                  <ResultBadge
                    type={results.clientTrace.type}
                    spanOp={results.clientTrace.spanOp}
                    onCopy={() => {}}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Server-Side Panel */}
          <div className="demo-panel">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-3 h-3 rounded-full bg-[var(--lagoon)]" />
              <h2 className="demo-section-title">Server-Side Testing</h2>
            </div>

            <div className="space-y-4">
              <div>
                <SentryButton
                  variant="error"
                  onClick={handleServerError}
                  loading={isLoading.serverError}
                  disabled={sentryConfigured === false}
                >
                  Trigger Server Error
                </SentryButton>
                {isLoading.serverError && (
                  <ProgressBar loading={isLoading.serverError} />
                )}
                {results.serverError && !isLoading.serverError && (
                  <ResultBadge
                    type={results.serverError.type}
                    spanOp={results.serverError.spanOp}
                    onCopy={() => {}}
                  />
                )}
              </div>

              <div>
                <SentryButton
                  variant="primary"
                  onClick={handleServerTrace}
                  loading={isLoading.serverTrace}
                  disabled={sentryConfigured === false}
                >
                  Test Server Trace
                </SentryButton>
                {isLoading.serverTrace && (
                  <ProgressBar loading={isLoading.serverTrace} />
                )}
                {results.serverTrace && !isLoading.serverTrace && (
                  <ResultBadge
                    type={results.serverTrace.type}
                    spanOp={results.serverTrace.spanOp}
                    onCopy={() => {}}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-12 text-center">
          <p className="demo-muted text-sm">
            This page uses <code>@sentry/tanstackstart-react</code> for
            full-stack error monitoring.
            <br />
            <a
              href="https://docs.sentry.io/platforms/javascript/guides/tanstackstart-react/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Read the documentation →
            </a>
          </p>
        </div>
      </div>
    </main>
  )
}
