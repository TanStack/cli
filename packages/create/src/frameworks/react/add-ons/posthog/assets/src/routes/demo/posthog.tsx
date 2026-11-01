import { createFileRoute, Link } from '@tanstack/react-router'
import { usePostHog } from '@posthog/react'
import { useState } from 'react'

export const Route = createFileRoute('/demo/posthog')({
  component: PostHogDemo,
})

function PostHogDemo() {
  const posthog = usePostHog()
  const [eventCount, setEventCount] = useState(0)
  const posthogKey = import.meta.env.VITE_POSTHOG_KEY
  const isConfigured = Boolean(posthogKey) && posthogKey !== 'phc_xxx'

  const trackEvent = (
    eventName: string,
    properties?: Record<string, unknown>,
  ) => {
    posthog.capture(eventName, properties)
    setEventCount((c) => c + 1)
  }

  return (
    <main className="demo-page demo-center">
      <section className="demo-panel w-full max-w-md">
        <p className="island-kicker mb-2">Analytics</p>
        <h1 className="demo-title mb-6">PostHog Demo</h1>

        {!isConfigured && (
          <div className="demo-alert mb-4">
            <p className="text-sm">
              <strong>Warning:</strong> VITE_POSTHOG_KEY is not configured.
              Events won't be sent to PostHog. Add it to your <code>.env</code>{' '}
              file.
            </p>
          </div>
        )}

        <div className="demo-card">
          <p className="demo-muted mb-4">
            Click the button below to send events to PostHog. Check your PostHog
            dashboard to see them appear in real-time.
          </p>

          <button
            onClick={() => trackEvent('button_clicked', { button: 'demo' })}
            className="demo-button w-full"
          >
            Track Click
          </button>

          {isConfigured && (
            <div className="demo-list-item mt-6">
              <p className="demo-muted text-sm">Events sent this session:</p>
              <p className="text-4xl font-bold">{eventCount}</p>
            </div>
          )}
        </div>

        <p className="demo-muted mt-4 text-sm">
          Open your{' '}
          <a
            href="https://app.posthog.com/events"
            target="_blank"
            rel="noopener noreferrer"
          >
            PostHog Events
          </a>{' '}
          page to see these events appear.
        </p>

        <p className="demo-muted mt-2 text-sm">
          Learn more in the{' '}
          <a
            href="https://posthog.com/docs/libraries/react"
            target="_blank"
            rel="noopener noreferrer"
          >
            PostHog React docs
          </a>
          .
        </p>

        <div className="mt-8">
          <Link to="/">&larr; Back to Home</Link>
        </div>
      </section>
    </main>
  )
}
