## Setting up Descope

1. Sign up at [descope.com](https://descope.com) and create a project
2. Copy your **Project ID** from the [Console](https://app.descope.com/settings/project)
3. Set it in your `.env.local`:
   ```bash
   VITE_DESCOPE_PROJECT_ID=P...
   ```
4. Make sure a **`sign-up-or-in`** flow exists in the Console (it ships by default)
5. Add `http://localhost:3000` to your project's approved domains / redirect URLs
6. Visit the demo route at `/demo/descope` once `npm run dev` is running

### What's wired up

- **`<AuthProvider>`** at the app root (`src/integrations/descope/provider.tsx`) supplies auth context to the whole tree
- **Header user menu** (`src/integrations/descope/header-user.tsx`) renders the signed-in avatar + "Sign out" button (hidden when signed out)
- **`/demo/descope`** renders the Descope `<Descope flowId="sign-up-or-in" />` flow and a signed-in greeting

### Protecting a route

Use the `useSession` hook to gate content:

```tsx
import { useSession } from '@descope/react-sdk'

function ProtectedPage() {
  const { isAuthenticated, isSessionLoading } = useSession()

  if (isSessionLoading) return <p>Loading…</p>
  if (!isAuthenticated) return <RedirectToSignIn />

  return <YourPageContent />
}
```

For server-side checks (route loaders, server functions), validate the session
token with the [`@descope/node-sdk`](https://docs.descope.com/sdks/nodejs) and
`validateSession()`.

### Production checklist

- Use a dedicated **production project** and its Project ID
- Configure your production domain under **Project Settings → Domains**
- Customize your flows (branding, connectors, MFA) in the **Flows** section of the Console
- Enable the social / SSO connectors you need under **Authentication Methods**
