## Setting up Clerk

1. Create an application in the [Clerk dashboard](https://dashboard.clerk.com).
2. Copy its publishable and secret keys into `.env.local`:

   ```bash
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   ```

3. Start the app and visit `/demo/clerk`.

### What's wired up

- `clerkMiddleware()` authenticates each server request from `src/start.ts`.
- `<ClerkProvider>` supplies auth state throughout the app.
- `<SignInButton>` and `<UserButton>` in the header respond to the session.
- `/demo/clerk` shows Clerk's prebuilt sign-in UI and signed-in user data.

### Protecting a route

Use `auth()` in a loader or server function when authorization must happen on the
server:

```tsx
import { createFileRoute, redirect } from '@tanstack/react-router'
import { auth } from '@clerk/tanstack-react-start/server'

export const Route = createFileRoute('/dashboard')({
  beforeLoad: async () => {
    const { userId } = await auth()
    if (!userId) throw redirect({ to: '/' })
  },
})
```

`<Show when="signed-in">` remains useful for presentation, but server-side checks
are the security boundary. See Clerk's [TanStack Start docs](https://clerk.com/docs/tanstack-react-start/getting-started/quickstart).

### Production checklist

- Set both keys in the production environment; never expose `CLERK_SECRET_KEY`.
- Use production keys from a dedicated production Clerk instance.
- Configure the production domain and any social connections in the Clerk dashboard.
