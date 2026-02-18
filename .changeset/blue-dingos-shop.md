---
'@tanstack/create': patch
---

Improve the Strapi add-on scaffolding for reliability.

- Remove brittle post-create shell automation that attempted to clone and bootstrap a sibling Strapi server.
- Fix Strapi article detail routing to use a consistent file-based route path.
- Update Strapi add-on guidance to document manual/hosted Strapi setup expectations.
