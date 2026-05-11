# Shopify

Headless Shopify storefront for TanStack Start. Mounts `/shop/*` routes
alongside your existing app — your home page stays untouched.

The default `.env.local` points at Shopify's public Hydrogen demo store, so the
storefront renders real products on first run with zero setup.

## Routes

| Route                          | What it does                                |
|--------------------------------|---------------------------------------------|
| `/shop`                        | Shop landing — featured products + collections |
| `/shop/products/$handle`       | Product detail (variants, images, options)  |
| `/shop/collections/$handle`    | Collection grid with sort + pagination      |
| `/shop/cart`                   | Cart line items, discount codes, checkout   |
| `/shop/search`                 | Product search                              |
| `/shop/pages/$handle`          | Shopify CMS pages (about, etc.)             |
| `/shop/policies/$handle`       | Privacy, refund, terms, shipping            |

If you opted into customer accounts during scaffold:

| Route                                | What it does                       |
|--------------------------------------|------------------------------------|
| `/shop/account/login`                | Kick off Shopify OAuth             |
| `/shop/account/callback`             | OAuth callback handler             |
| `/shop/account/logout`               | End the customer session           |
| `/shop/account`                      | Dashboard                          |
| `/shop/account/orders`               | Order history                      |
| `/shop/account/orders/$id`           | Order detail                       |
| `/shop/account/addresses`            | Manage saved addresses             |

## Connect your store

1. In Shopify admin, go to **Settings > Apps and sales channels > Develop apps**.
2. Create a new app, enable the **Storefront API**, and copy the public access token.
3. Set in `.env.local`:
   ```
   SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
   SHOPIFY_PUBLIC_STOREFRONT_TOKEN=...
   ```
4. (Optional) For higher rate limits + buyer-IP forwarding, also create a private
   token and set `SHOPIFY_PRIVATE_STOREFRONT_TOKEN`.

## Enable customer accounts

If `customerAccount=enabled` was selected during scaffold:

1. In Shopify admin, go to **Settings > Customer accounts > Headless**.
2. Register a public client. Add `http://localhost:3000/shop/account/callback`
   *and* your production callback URL to the redirect URIs.
3. Copy the Client ID and Shop ID into `.env.local`:
   ```
   SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID=...
   SHOPIFY_CUSTOMER_ACCOUNT_SHOP_ID=...
   SHOPIFY_SESSION_SECRET=$(openssl rand -hex 32)
   ```

The Hydrogen demo store doesn't have customer accounts configured, so the
default demo creds won't work for `/shop/account/*` — you'll need a real store.

## Architecture

- **Storefront API client** — server-only fetch in `src/server/shopify/storefront-client.ts`.
  All product/cart reads go through the server (private token never reaches the browser).
- **Cart state** — Cart ID stored in an httpOnly cookie (`tanstack_cart_id`). React
  Query owns the cache (single key `['shopify', 'cart']`); optimistic updates with
  a module-level mutation counter to batch invalidations.
- **GraphQL queries** — hand-written strings in `src/lib/shopify/queries.ts`, types
  sliced from `@shopify/hydrogen-react/storefront-api-types` (type-only import; zero runtime).
- **Customer accounts** — hand-rolled OAuth 2.1 PKCE with `.well-known` discovery
  (no usable npm client exists yet). Tokens in a signed httpOnly cookie.
- **Checkout** — redirects to `cart.checkoutUrl` (Shopify-hosted).

## Deployment

Works anywhere TanStack Start runs:

- **Node** — `npm run build && npm start`
- **Cloudflare Workers / Shopify Oxygen** — Oxygen is just Workers under the hood;
  build with the Workers preset and deploy to either platform.
- **Vercel / Netlify** — set the env vars in the dashboard.
- **Bun, Deno** — supported via Start's adapters.

For the customer-account flow, register both your local *and* production
callback URLs in the Shopify admin's headless app config.
