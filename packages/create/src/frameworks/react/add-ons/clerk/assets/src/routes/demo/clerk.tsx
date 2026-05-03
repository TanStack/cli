import { createFileRoute } from '@tanstack/react-router'
import {
  SignIn,
  SignedIn,
  SignedOut,
  useUser,
} from '@clerk/clerk-react'

export const Route = createFileRoute('/demo/clerk')({
  component: ClerkDemo,
})

function ClerkDemo() {
  return (
    <div className="flex justify-center py-10 px-4">
      <div className="w-full max-w-md p-6 space-y-6">
        <SignedOut>
          <div className="space-y-1.5">
            <h1 className="text-lg font-semibold leading-none tracking-tight">
              Sign in to continue
            </h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Clerk renders the sign-in UI, manages sessions, and handles social providers for you.
            </p>
          </div>
          <div className="flex justify-center pt-2">
            <SignIn routing="hash" />
          </div>
          <p className="text-xs text-center text-neutral-400 dark:text-neutral-500">
            Built with{' '}
            <a
              href="https://clerk.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium hover:text-neutral-600 dark:hover:text-neutral-300"
            >
              CLERK
            </a>
            .
          </p>
        </SignedOut>

        <SignedIn>
          <SignedInGreeting />
        </SignedIn>
      </div>
    </div>
  )
}

function SignedInGreeting() {
  const { user } = useUser()
  if (!user) return null

  const email = user.primaryEmailAddress?.emailAddress
  const initial = (user.firstName || email || 'U').charAt(0).toUpperCase()

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-lg font-semibold leading-none tracking-tight">
          Welcome back
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          You're signed in as {email}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {user.imageUrl ? (
          <img src={user.imageUrl} alt="" className="h-10 w-10 rounded-full" />
        ) : (
          <div className="h-10 w-10 bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center rounded-full">
            <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
              {initial}
            </span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">
            {user.firstName} {user.lastName}
          </p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
            {email}
          </p>
        </div>
      </div>

      <p className="text-xs text-center text-neutral-400 dark:text-neutral-500">
        Manage your account from the avatar in the header. Built with{' '}
        <a
          href="https://clerk.com"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium hover:text-neutral-600 dark:hover:text-neutral-300"
        >
          CLERK
        </a>
        .
      </p>
    </div>
  )
}
