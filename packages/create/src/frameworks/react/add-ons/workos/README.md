## Setting up WorkOS

This integration uses WorkOS AuthKit's full-stack TanStack Start SDK and requires
Node.js 22.11 or newer.

1. Copy your client ID and API key from the [WorkOS dashboard](https://dashboard.workos.com/api-keys).
2. Fill in `.env.local`:

   ```bash
   WORKOS_CLIENT_ID=client_...
   WORKOS_API_KEY=sk_test_...
   WORKOS_REDIRECT_URI=http://localhost:3000/api/auth/callback
   WORKOS_COOKIE_PASSWORD=a-random-value-at-least-32-characters-long
   WORKOS_API_HOSTNAME=api.workos.com
   ```

3. On the dashboard's [Redirects page](https://dashboard.workos.com/redirects), add
   `http://localhost:3000/api/auth/callback` as a redirect URI and
   `http://localhost:3000/api/auth/sign-in` as the sign-in endpoint.
4. Start the app and visit `/demo/workos`.

### What's wired up

- `authkitMiddleware()` manages the encrypted server-side session in `src/start.ts`.
- `/api/auth/callback` completes the OAuth callback.
- `/api/auth/sign-in` initiates sign-in and supports a `returnPathname` query parameter.
- `<AuthKitProvider>` supplies reactive auth state to the header and demo route.

For authorization in loaders and server functions, use `getAuth()` from
`@workos/authkit-tanstack-react-start`. Keep `WORKOS_API_KEY` and
`WORKOS_COOKIE_PASSWORD` server-only, and replace the local callback and sign-in URLs
with their production equivalents when deploying.
