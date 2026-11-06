---
'@tanstack/cli': minor
'@tanstack/create': minor
---

feat(create): add React PocketBase add-on

`tanstack add pocketbase` (or `--add-ons pocketbase` on `tanstack create`)
wires the PocketBase JS SDK into a React TanStack Start app:

- `pocketbase` dependency and a `src/lib/pocketbase.ts` client reading
  `VITE_POCKETBASE_URL` from `.env.local`, plus a `createPocketBase()`
  factory for per-request clients in server functions.
- A `pb_migrations/` JS migration that creates an owner-scoped `todos`
  collection when running `./pocketbase serve`, and `pb_data/` added to
  `.gitignore`.
- A `/demo/pocketbase` route with email and password sign-in and a private
  realtime todo list (create, toggle, delete, live updates across tabs), plus
  setup guidance when the server is not reachable.
