import { useMemo, useRef, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Descope, useSession, useUser } from '@descope/react-sdk'

export const Route = createFileRoute('/demo/descope')({
  component: DescopeDemo,
})

function DescopeDemo() {
  const { isAuthenticated, isSessionLoading } = useSession()

  return (
    <main className="demo-page demo-center">
      <section className="demo-panel w-full max-w-md space-y-6">
        {isSessionLoading ? (
          <p className="demo-muted text-center text-sm">Loading…</p>
        ) : isAuthenticated ? (
          <SignedInGreeting />
        ) : (
          <SignedOut />
        )}
      </section>
    </main>
  )
}

function SignedOut() {
  const [attempt, setAttempt] = useState(0)

  return (
    <>
      <h1 className="demo-title">Sign in with Descope</h1>
      <SignInFlow
        key={attempt}
        onRetry={() => setAttempt((value) => value + 1)}
      />
    </>
  )
}

function SignInFlow({ onRetry }: { onRetry: () => void }) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const ready = useRef(false)
  const logger = useMemo(
    () => ({
      debug: console.debug,
      info: console.info,
      warn: console.warn,
      error: (...messages: unknown[]) => {
        console.error(...messages)
        // Logging can also precede the SDK's own fallback or retry. Report the
        // problem without unmounting the flow and interrupting that recovery.
        if (!ready.current) setStatus('error')
      },
    }),
    [],
  )

  return (
    <div className="flex flex-col items-center gap-3 pt-2">
      {status === 'loading' && <p role="status">Loading sign-in…</p>}
      <Descope
        flowId="sign-up-or-in"
        theme="light"
        logger={logger}
        onReady={() => {
          ready.current = true
          setStatus('ready')
        }}
        onError={() => setStatus('error')}
        onScreenUpdate={() => {
          if (ready.current) setStatus('ready')
          return false
        }}
      />
      {status === 'error' && (
        <div role="alert" className="space-y-3 text-center">
          <p>
            Sign-in reported a problem. Check your connection, or restart this
            flow.
          </p>
          <button type="button" onClick={onRetry} className="demo-button">
            Restart sign-in
          </button>
        </div>
      )}
    </div>
  )
}

function SignedInGreeting() {
  const { user } = useUser()
  if (!user) return null

  const email = user.email
  const initial = (user.name || email || 'U').charAt(0).toUpperCase()

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="demo-title">Signed in</h1>
      </div>

      <div className="flex items-center gap-3">
        {user.picture ? (
          <img src={user.picture} alt="" className="h-10 w-10 rounded-full" />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-200 dark:bg-neutral-800">
            <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
              {initial}
            </span>
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{user.name}</p>
          <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">
            {email}
          </p>
        </div>
      </div>
    </div>
  )
}
