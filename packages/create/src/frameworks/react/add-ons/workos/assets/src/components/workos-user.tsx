import { useAuth } from '@workos-inc/authkit-react'

export default function SignInButton({ large }: { large?: boolean }) {
  const { user, isLoading, signIn, signOut } = useAuth()

  const buttonClasses = `${
    large ? 'px-6 py-3 text-base' : 'px-4 py-2 text-sm'
  } demo-button disabled:opacity-50 disabled:cursor-not-allowed`

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
        <button onClick={() => signOut()} className={buttonClasses}>
          Sign Out
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => {
        signIn()
      }}
      className={buttonClasses}
      disabled={isLoading}
    >
      Sign In {large && 'with AuthKit'}
    </button>
  )
}
