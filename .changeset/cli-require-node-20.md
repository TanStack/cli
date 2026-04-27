---
'@tanstack/cli': patch
'@tanstack/create': patch
---

fix(cli): require Node.js >=20 and surface a clear error on older runtimes

Older Node versions (e.g. Node 16) lack `events.addAbortListener`, which is
used transitively by the CLI. Running on those versions produced a cryptic
`SyntaxError: ... does not provide an export named 'addAbortListener'` during
module instantiation. Both packages now declare `engines.node: ">=20"` so
package managers warn at install time, and the CLI bin performs an early
runtime check that prints an actionable message before any modules load.

Closes #433
