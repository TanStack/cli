---
'@tanstack/create': patch
---

Fix demo/example files leaking into projects when users opt out of demo pages.

- Strip add-on demo support files in `src/lib/`, `src/hooks/`, `src/data/`, `src/components/`, `src/store/`, and any `demo.*` / `demo-*` / `example.*` / `example-*` files.
- Strip example image assets under `public/`.
- Generate a minimal base starter (no Header, Footer, ThemeToggle, about page, or styled index page) when declining demo/example pages.
- Render Better Auth header-user component as `null` when its demo route is excluded, instead of linking to a non-existent route.

Closes #422, #409.
