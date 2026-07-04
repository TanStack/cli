---
"@tanstack/create": patch
"@tanstack/cli": patch
---

Fix router-only package manifests by providing `@tanstack/router-core` for devtools under strict package managers and keeping `@tanstack/router-plugin` in devDependencies only.
