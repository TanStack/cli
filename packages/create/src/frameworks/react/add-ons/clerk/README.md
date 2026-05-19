## Setting up Clerk

1. Sign up at [clerk.com](https://clerk.com) and create an application
2. Copy the **Publishable Key** from the Clerk dashboard
3. Set it in your `.env.local`:
   ```bash
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
   ```
4. Visit the demo route at `/demo/clerk` once `npm run dev` is running

### What's wired up

- **`<ClerkProvider>`** at the app root (`src/integrations/clerk/provider.tsx`) handles auth context for the whole tree
- **`<SignInButton>` / `<UserButton>`** in the header swap based on auth state
- **`/demo/clerk`** shows Clerk's prebuilt sign-in UI and a signed-in greeting

### Protecting a route

Wrap any component in `<SignedIn>` / `<SignedOut>`:

```tsx
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react'

function ProtectedPage() {
  return (
    <>
      <SignedIn>
        <YourPageContent />
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  )
}
```

For server-side checks (route loaders, server functions), see the Clerk docs on [`auth()`](https://clerk.com/docs/references/backend/auth).

### Production checklist

- Replace the test keys with **production keys** from a dedicated production Clerk instance
- Configure your production domain under **Domains** in the Clerk dashboard
- Set up social providers (Google, GitHub, etc.) under **User & Authentication → Social Connections**
