import { useAuth } from '@workos/authkit-tanstack-react-start/client'

export default function WorkOSUser({ large }: { large?: boolean }) {
  const { user, loading, signOut } = useAuth()

  const buttonClasses = `${
    large ? 'px-6 py-3 text-base' : 'px-4 py-2 text-sm'
  } demo-button`

  if (loading) return null

  if (user) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          {user.profilePictureUrl && (
            <img
              src={user.profilePictureUrl}
              alt={`Avatar of ${user.firstName} ${user.lastName}`}
              className="w-10 h-10 rounded-full"
            />
          )}
          {user.firstName} {user.lastName}
        </div>
        <button onClick={() => void signOut()} className={buttonClasses}>
          Sign Out
        </button>
      </div>
    )
  }

  return (
    <a href="/api/auth/sign-in" className={buttonClasses}>
      Sign In {large && 'with AuthKit'}
    </a>
  )
}
