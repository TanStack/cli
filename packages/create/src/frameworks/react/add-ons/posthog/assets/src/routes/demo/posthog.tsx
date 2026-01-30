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
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-bold mb-6">PostHog Demo</h1>

        {!isConfigured && (
          <div className="mb-4 p-4 bg-yellow-900/50 border border-yellow-600 rounded-lg">
            <p className="text-yellow-200 text-sm">
              <strong>Warning:</strong> VITE_POSTHOG_KEY is not configured.
              Events won't be sent to PostHog. Add it to your{' '}
              <code className="bg-yellow-900 px-1 rounded">.env</code> file.
            </p>
          </div>
        )}

        <div className="bg-gray-800 rounded-lg p-6">
          <p className="text-gray-400 mb-4">
            Click the button below to send events to PostHog. Check your PostHog
            dashboard to see them appear in real-time.
          </p>

          <button
            onClick={() => trackEvent('button_clicked', { button: 'demo' })}
            className="w-full bg-cyan-600 hover:bg-cyan-700 px-4 py-3 rounded font-medium"
          >
            Track Click
          </button>

          {isConfigured && (
            <div className="mt-6 p-4 bg-gray-700 rounded">
              <p className="text-sm text-gray-400">Events sent this session:</p>
              <p className="text-4xl font-bold text-cyan-400">{eventCount}</p>
            </div>
          )}
        </div>

        <p className="mt-4 text-sm text-gray-400">
          Open your{' '}
          <a
            href="https://app.posthog.com/events"
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-400 hover:text-cyan-300 underline"
          >
            PostHog Events
          </a>{' '}
          page to see these events appear.
        </p>

        <p className="mt-2 text-sm text-gray-400">
          Learn more in the{' '}
          <a
            href="https://posthog.com/docs/libraries/react"
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-400 hover:text-cyan-300 underline"
          >
            PostHog React docs
          </a>
          .
        </p>

        <div className="mt-8">
          <Link to="/" className="text-cyan-400 hover:text-cyan-300">
            &larr; Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
