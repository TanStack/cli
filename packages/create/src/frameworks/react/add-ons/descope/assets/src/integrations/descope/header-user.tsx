import { useDescope, useSession, useUser } from '@descope/react-sdk'

export default function HeaderUser() {
  const { isAuthenticated, isSessionLoading } = useSession()
  const { user, isUserLoading } = useUser()
  const sdk = useDescope()

  if (isSessionLoading || isUserLoading || !isAuthenticated) return null

  const email = user?.email
  const initial = (user?.name || email || 'U').charAt(0).toUpperCase()

  return (
    <div className="flex items-center gap-2">
      {user?.picture ? (
        <img src={user.picture} alt="" className="h-8 w-8 rounded-full" />
      ) : (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-200 dark:bg-neutral-800">
          <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
            {initial}
          </span>
        </div>
      )}
      <button
        type="button"
        onClick={() =>
          sdk.logout().catch((err) => console.error('Descope logout error', err))
        }
        className="rounded-xl px-3 py-1.5 text-sm font-semibold text-[var(--sea-ink-soft)] transition hover:bg-[var(--link-bg-hover)] hover:text-[var(--sea-ink)]"
      >
        Sign out
      </button>
    </div>
  )
}
