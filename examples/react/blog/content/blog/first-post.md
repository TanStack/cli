---
title: 'Neon Mango Protocol'
description: 'A quick walkthrough of the starter foundations.'
pubDate: 'Jul 08 2024'
heroImage: '/images/lagoon-3.svg'
---

This starter ships with routes, SSR, and a calm visual system out of the box.

Start by editing route files, then layer in add-ons as needed.

## What you get on day one

- Full-document SSR using TanStack Start
- Type-safe file routing with generated route types
- A reusable design token system for light and dark themes

The goal is simple: let teams ship product pages and APIs without spending the
first week wiring framework internals.

### Suggested order of operations

1. Make the home route feel like your product
2. Add one feature route and one API route
3. Introduce add-ons only after your core UX is clear

> Keep the first commit boring. Reliable defaults beat clever setup code.

## Baseline delivery checklist

Before introducing custom infra, confirm these are green:

- `pnpm dev` starts cleanly
- one server route returns typed data
- one API route validates input/output
- one integration test exercises a full page render

When these are in place, you can iterate quickly without losing confidence.

### Example request flow

1. Client navigation enters route loader
2. Loader calls server function
3. Server function reads data source and returns typed payload
4. Route component renders immediately with stable shape

That flow is simple, predictable, and easy to debug.
