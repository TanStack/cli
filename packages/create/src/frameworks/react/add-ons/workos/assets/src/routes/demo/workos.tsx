import { createFileRoute } from '@tanstack/react-router'
import { useAuth } from '@workos-inc/authkit-react'

export const Route = createFileRoute('/demo/workos')({
  ssr: false,
  component: App,
})

function App() {
  const { user, isLoading, signIn, signOut } = useAuth()

  if (isLoading) {
    return (
      <main className="demo-page demo-center">
        <section className="demo-panel w-full max-w-md">
          <p className="demo-muted text-center">Loading...</p>
        </section>
      </main>
    )
  }

  if (user) {
    return (
      <main className="demo-page demo-center">
        <section className="demo-panel w-full max-w-md">
          <p className="island-kicker mb-2 text-center">WorkOS</p>
          <h1 className="demo-title mb-6 text-center">User Profile</h1>

          <div className="space-y-6">
            {user.profilePictureUrl && (
              <div className="flex justify-center">
                <img
                  src={user.profilePictureUrl}
                  alt={`Avatar of ${user.firstName} ${user.lastName}`}
                  className="h-24 w-24 rounded-full border border-[var(--line)] shadow-lg"
                />
              </div>
            )}

            <div className="space-y-4">
              <div className="demo-list-item">
                <label className="demo-muted block text-sm font-medium mb-1">
                  First Name
                </label>
                <p className="text-lg">{user.firstName || 'N/A'}</p>
              </div>

              <div className="demo-list-item">
                <label className="demo-muted block text-sm font-medium mb-1">
                  Last Name
                </label>
                <p className="text-lg">{user.lastName || 'N/A'}</p>
              </div>

              <div className="demo-list-item">
                <label className="demo-muted block text-sm font-medium mb-1">
                  Email
                </label>
                <p className="break-all text-lg">{user.email || 'N/A'}</p>
              </div>

              <div className="demo-list-item">
                <label className="demo-muted block text-sm font-medium mb-1">
                  User ID
                </label>
                <p className="demo-muted break-all font-mono text-sm">
                  {user.id || 'N/A'}
                </p>
              </div>
            </div>

            <button onClick={() => signOut()} className="demo-button w-full">
              Sign Out
            </button>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="demo-page demo-center">
      <section className="demo-panel w-full max-w-md">
        <p className="island-kicker mb-2 text-center">WorkOS</p>
        <h1 className="demo-title mb-6 text-center">WorkOS Authentication</h1>
        <p className="demo-muted text-center mb-6">
          Sign in to view your profile information
        </p>
        <button
          onClick={() => signIn()}
          disabled={isLoading}
          className="demo-button w-full"
        >
          Sign In with AuthKit
        </button>
      </section>
    </main>
  )
}
