---
'@tanstack/create': patch
---

Modernize the Clerk and WorkOS add-ons with their full-stack TanStack Start SDKs,
update Railway projects for Railpack, and use safer Sentry defaults. Secret
environment values are no longer stored in `.cta.json` or overwritten by
`tanstack add`, and pnpm 11 projects receive the build approvals their selected
integrations require.
