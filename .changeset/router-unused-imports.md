---
'@tanstack/create': patch
---

Drop unused React Query imports from the generated React `router.tsx`. The
`tanstack-query` branch imported `ReactNode`, `QueryClient` and the
`TanstackQueryProvider` default export whenever the add-on was enabled, but
`ReactNode` and `TanstackQueryProvider` are only referenced inside the tRPC
`Wrap` block and `QueryClient` was never referenced at all. Generated projects
set `noUnusedLocals: true`, so a fresh scaffold shipped code that violates its
own tsconfig. The two tRPC-only imports are now gated behind
`addOnEnabled.tRPC` and the `QueryClient` import is removed.
