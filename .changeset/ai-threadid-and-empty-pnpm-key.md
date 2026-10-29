---
'@tanstack/create': patch
---

fix(create): make AI add-on chat sample work out of the box and drop the empty `pnpm` key

- The AI add-on's chat hook now passes the required `threadId` to `useChat`, so the generated sample runs without manual fixing.
- Removed the empty `"pnpm": {}` key from the React and Solid base templates so generated projects no longer carry an invalid, empty `pnpm` field. Add-ons that need `pnpm.onlyBuiltDependencies` still inject it.
