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
  return (
    <>
      <div className="space-y-1.5">
        <p className="island-kicker mb-2">Descope</p>
        <h1 className="demo-title">Sign in to continue</h1>
        <p className="demo-muted text-sm">
          Descope renders the sign-in flow, manages sessions, and handles
          passwordless, SSO, and social login for you.
        </p>
      </div>
      <div className="flex justify-center pt-2">
        <Descope
          flowId="sign-up-or-in"
          theme="light"
          onError={(err) => console.error('Descope flow error', err)}
        />
      </div>
      <p className="demo-muted text-center text-xs">
        Built with{' '}
        <a
          href="https://descope.com"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium"
        >
          DESCOPE
        </a>
        .
      </p>
    </>
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
        <p className="island-kicker mb-2">Descope</p>
        <h1 className="demo-title">Welcome back</h1>
        <p className="demo-muted text-sm">You're signed in as {email}</p>
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

      <p className="demo-muted text-center text-xs">
        Sign out from the avatar in the header. Built with{' '}
        <a
          href="https://descope.com"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium"
        >
          DESCOPE
        </a>
        .
      </p>
    </div>
  )
}
