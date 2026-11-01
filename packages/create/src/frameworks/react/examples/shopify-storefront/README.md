# Shopify Storefront

A storefront-first TanStack Start template. Bundles the [Shopify add-on](../../add-ons/shopify)
plus a polished home page so the home route (`/`) is your shop landing.

```bash
npx @tanstack/cli create my-shop --template shopify-storefront
```

## What you get

- `/` — Storefront landing (replaces the default home)
- `/shop` — Catalog landing with collections sidebar
- `/shop/products/$handle`, `/shop/collections/$handle`, `/shop/cart`, `/shop/search`,
  `/shop/pages/$handle`, `/shop/policies/$handle` — full Hydrogen-demo parity
- `/shop/account/*` — optional, if you opted into customer accounts during scaffold

The default `.env.local` points at Shopify's public Hydrogen demo store, so you'll
see real products on first run with zero setup. See
[the add-on README](../../add-ons/shopify/README.md) for connecting your own store.

## Brand swap-out

Three files own the look-and-feel:

- `src/routes/index.tsx` — the home page hero + featured collections
- `src/components/ShopHero.tsx` — the marquee
- `src/components/FeaturedCollections.tsx` — the collection cards

The shop's design tokens (`--storefront-bg`, `--storefront-fg`, `--storefront-accent`,
etc.) are defined in the Shopify add-on's `src/components/shop/shop.css`. Override
those six variables in your own CSS to re-skin the entire storefront.

## Removing demo content

To strip the hero/landing and use the bare add-on instead:

1. Delete `src/components/ShopHero.tsx` and `src/components/FeaturedCollections.tsx`.
2. Replace `src/routes/index.tsx` with a redirect to `/shop` (or your preferred home).
