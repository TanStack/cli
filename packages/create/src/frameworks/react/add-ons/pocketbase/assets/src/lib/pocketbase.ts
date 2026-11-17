import PocketBase from 'pocketbase'

export const POCKETBASE_URL =
  import.meta.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090'

/**
 * Browser-side PocketBase client.
 *
 * The auth store of this instance is persisted in localStorage, so use it
 * from client components only. For server functions, create a fresh client
 * per request with `createPocketBase()` so auth state is never shared
 * between users.
 */
export const pb = createPocketBase()

export function createPocketBase() {
  const client = new PocketBase(POCKETBASE_URL)
  // Avoid cancelling duplicated requests (e.g. React StrictMode double effects).
  client.autoCancellation(false)
  // On a 401, sign out only if the rejected token is still the current one.
  // The SDK's built-in auto-clear would also drop a newer session, e.g. one
  // signed in from another tab while this request was in flight.
  client.autoClearAuthStore(false)
  client.afterSend = (
    response: Response,
    data: unknown,
    options?: { headers?: Record<string, string> },
  ) => {
    const token = options?.headers?.Authorization
    if (response.status === 401 && token && token === client.authStore.token) {
      client.authStore.clear()
    }
    return data
  }
  return client
}
