---
'@tanstack/cli': minor
'@tanstack/create': minor
---

feat(create): add React PowerSync scaffolding add-on

`tanstack add powersync` (or `--add-ons powersync` on `tanstack create`)
wires the PowerSync Web SDK into a React TanStack Start app:

- `@powersync/web` + `@powersync/react` + `@journeyapps/wa-sqlite`
  dependencies and a Vite plugin that excludes `@powersync/web` from
  `optimizeDeps` and emits ES-module workers (required for the
  WA-SQLite VFS).
- A `PowerSyncProvider` integration that opens a WA-SQLite database
  and connects with `disableSSRWarning` so SSR doesn't warn.
- A sample `AppSchema` (todos table) and `BackendConnector` with
  `fetchCredentials` reading `VITE_POWERSYNC_URL` / `VITE_POWERSYNC_TOKEN`
  from `.env.local` and a stubbed `uploadData()` ready for the user's
  upstream write logic.
- A `/demo/powersync` route that inserts rows locally and renders
  live `useQuery` results plus connection status, so the scaffold
  works zero-config and shows the SDK is wired up before any
  PowerSync instance is configured.
