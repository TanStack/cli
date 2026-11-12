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
  return client
}
