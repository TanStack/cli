---
'@tanstack/create': patch
---

Drop two dead imports from the generated tRPC integration. `api.trpc.$.tsx`
imported `createServerFileRoute` from `@tanstack/react-start/server`, but the
route was already migrated to `createFileRoute(...)({ server: { handlers } })`
and that symbol is no longer exported, so the leftover import was both unused
and unresolvable. The tRPC branch of `root-provider.tsx` imported
`QueryClientProvider`, which it never renders —
`setupRouterSsrQueryIntegration` supplies the query client. Generated projects
set `noUnusedLocals: true`, so both showed up as errors in a fresh scaffold.
