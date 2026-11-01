---
title: 'Paper Lantern Cache'
description: 'How to shape navigation and page structure.'
pubDate: 'Jul 15 2024'
heroImage: '/images/lagoon-4.svg'
---

Use file-based routes in `src/routes` to grow the app.

Keep shared UI in `src/components` and tune visual tokens in `src/styles.css`.

## Route design tips

Treat routes like product domains, not technical buckets.

- `routes/settings.*` for account surfaces
- `routes/billing.*` for payment and plan logic
- `routes/api.*` for server handlers that belong to the same domain
