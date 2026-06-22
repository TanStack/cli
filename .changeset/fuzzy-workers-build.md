---
"@tanstack/create": patch
---

Fix Worker usage by adding a provider-based `@tanstack/create/worker` entry that avoids importing the full generated create manifest at startup.
