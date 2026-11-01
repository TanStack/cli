# Ecommerce Template

This is a product-focused ecommerce template for TanStack Start (React, file-based routing).

## Quick Start

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## What this template includes

- Catalog + product detail routes
- Reusable ecommerce UI components
- AI assistant wiring and demo tooling
- Add-on compatibility seams in the root shell (`integrations/**/{root-provider,provider}`)
- Demo route discoverability in the header (`/demo/*`)

## Environment

If you use the built-in AI assistant routes, set:

```env
ANTHROPIC_API_KEY=your_anthropic_api_key
```

## Notes

- Routes live in `src/routes`.
- `demo.*` files are safe to remove if you do not want demos.
- This template is intended to compose with add-ons (query, form, shadcn, store, strapi, etc.).
