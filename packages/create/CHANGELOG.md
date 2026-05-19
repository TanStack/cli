# @tanstack/create

## 0.68.0

### Minor Changes

- feat(create): add React PowerSync scaffolding add-on ([#448](https://github.com/TanStack/cli/pull/448))

  `tanstack add powersync` (or `--add-ons powersync` on `tanstack create`)
  wires the PowerSync Web SDK into a React TanStack Start app:

  - `@powersync/web` + `@powersync/react` + `@journeyapps/wa-sqlite`
    dependencies and a Vite plugin that excludes `@powersync/web` from
    `optimizeDeps` and emits ES-module workers (required for the
    WA-SQLite VFS).
  - A `PowerSyncProvider` integration that opens a WA-SQLite database
    and connects with `disableSSRWarning` so SSR doesn't warn.
  - A sample `AppSchema` (todos table) and `BackendConnector` with
    `fetchCredentials` reading `VITE_POWERSYNC_URL` / `VITE_POWERSYNC_TOKEN`
    from `.env.local` and a stubbed `uploadData()` ready for the user's
    upstream write logic.
  - A `/demo/powersync` route that inserts rows locally and renders
    live `useQuery` results plus connection status, so the scaffold
    works zero-config and shows the SDK is wired up before any
    PowerSync instance is configured.

## 0.67.0

### Minor Changes

- Auto-generated changeset from semantic commits on main.

  - feat(create): add React PowerSync scaffolding add-on (#407) (8f24af5)

## 0.66.0

### Minor Changes

- feat(cli, create): add Shopify storefront add-on + storefront template ([`814d222`](https://github.com/TanStack/cli/commit/814d222ac04e839eabe56abce5dcbe66d751c5d8))

  Headless Shopify support for TanStack Start apps, scaffold-ready and
  runtime-portable. The pitch: prove that TanStack Start is a first-class
  target for Shopify, not just Next.js Commerce or Hydrogen.

  **`shopify` add-on** — additive. `tanstack add shopify` mounts `/shop/*`
  routes alongside an existing app without touching the home page. Includes:

  - Storefront API client (server-only fetch via `createServerFn`, public
    token by default + optional private token for higher rate limits and
    buyer-IP forwarding).
  - Hand-written GraphQL queries with hydrogen-react types (type-only;
    zero runtime weight).
  - httpOnly cookie cart (`tanstack_cart_id`) + React Query single-key
    cache + optimistic updates with module-level mutation counter to
    batch invalidations during rapid clicks.
  - Hydrogen-demo parity routes: shop landing, product detail (with
    variants + availability), collections, cart, search, Shopify CMS
    pages, policies.
  - Hydrogen-stock UI components (ProductCard, VariantSelector,
    AddToCartButton, CartLineItem, CartSummary, ShopImage with CDN
    transforms, Money via Intl) themed with six CSS custom properties
    for easy reskinning.
  - Header cart-count badge via the `header-user` integration slot.
  - Shopify-hosted checkout (redirect to `cart.checkoutUrl`).
  - **Optional Customer Account API** behind a `customerAccount` select
    option. Hand-rolled OAuth 2.1 PKCE with `.well-known` discovery
    cached in module memory (no usable npm client exists yet),
    HMAC-signed httpOnly session cookies (HS256), lazy token refresh,
    account dashboard / orders / order detail / addresses routes — all
    EJS-guarded so the files only emit when enabled.

  **`shopify-storefront` template** — storefront-first.
  `tanstack create my-shop --template shopify-storefront` cascades the
  `shopify` add-on (which cascades `tanstack-query`) and replaces the
  home route with a polished landing (hero + featured collections + best
  sellers grid).

  **Zero-config first run.** Defaults to Shopify's public Hydrogen demo
  store (`hydrogen-preview.myshopify.com`) so the storefront renders
  real products immediately. Override the four env vars in `.env.local`
  (or your deploy target's dashboard) to point at your store. Demo
  defaults are baked into source as fallbacks, so the experience doesn't
  break when a runtime doesn't load `.env` files into `process.env`.

  **Portable.** Cookie ops via `@tanstack/react-start/server`; crypto via
  Web Crypto (`crypto.subtle`); generic `CDN-Cache-Control` for browse
  (`s-maxage=300, stale-while-revalidate=600`) and `private, no-store`
  for cart. Works on Node, Cloudflare Workers, Shopify Oxygen (just
  Workers), Vercel, Netlify, Bun, Deno.

  **Header layout fix.** While the cart-count badge is the new
  right-aligned action, the base scaffold's `Header` was placing the
  social icons left-of-center on `sm+`. Reordered the JSX so navigation
  sits between the logo and the right-side actions in DOM order, with
  one mobile-only `order-3` to keep `flex-wrap` putting nav on its own
  row. Result: logo → nav → (auto-spaced) → cart/social/theme on every
  breakpoint, and a more sensible reading order for screen readers.

## 0.65.0

### Minor Changes

- feat(cli, create): close the gap between `tanstack create` and shipping a real app ([#445](https://github.com/TanStack/cli/pull/445))

  A bundle of UX improvements aimed at beginners (especially those coming from Next.js) and the AI agents they pair with:

  - **Tailored post-creation next steps.** The scaffold completion message now lists the env vars you still need to fill in `.env.local`, links the docs for each shipping-critical integration you picked (auth, database, ORM, deployment), and surfaces the Intent-wired AGENTS.md / CLAUDE.md with concrete prompt examples.
  - **Pre-creation review screen.** After interactive prompts, the CLI shows a categorized summary (auth, database, ORM, deploy, other) and asks for confirmation before writing files. Conflicting selections (two auth providers, two ORMs, etc.) are flagged in the same step.
  - **`.env.example` generation.** A checked-in `.env.example` is now derived from the env-var schemas of selected add-ons, with descriptions and a `(required)` marker. Plays nicely with add-ons that ship their own `_dot_env.example.append`.
  - **Better add-on descriptions.** Concept-first one-liners replace generic "Add X to your application." Reads like a menu instead of a list of brand names.
  - **Deployment quickstarts.** Each `--deployment` host (Netlify, Cloudflare, Railway, Nitro) now contributes its own README section explaining the actual steps to ship — push, dashboard URL, env var sync.
  - **Clerk demo route parity.** Clerk's scaffold now ships a proper sign-in flow (matching Better Auth's depth) using Clerk's prebuilt components, plus a richer README with route-protection patterns and a production checklist.
  - **Intent install passes `--map`.** The auto-invoked `intent install` now writes explicit task→skill mappings into the agent config instead of relying on runtime discovery, so agents see directly which skill matches which task.
  - **`tanstack clean-demos` command.** A new subcommand removes leftover `demo.*` and `example.*` files (and prunes empty `routes/demo`/`routes/example` directories) so a beginner can ship without the scaffold's training wheels.

## 0.64.0

### Minor Changes

- feat(cli): auto-install TanStack Intent during scaffolding ([#442](https://github.com/TanStack/cli/pull/442))

  `tanstack create` and `tanstack add` now run `npx @tanstack/intent install`
  after dependency installation, wiring up skill mappings for coding agents.
  The behavior is controlled by a new `--intent` / `--no-intent` flag (default
  on) and persists to `.cta.json` so subsequent `add` invocations honor the
  original choice. Failures are surfaced as warnings instead of aborting the
  scaffold.

## 0.63.9

### Patch Changes

- fix(create): correct netlify.toml key, eslint scripts, and missing eslint dep ([`e38729f`](https://github.com/TanStack/cli/commit/e38729fe0b6a16e8d34417d2334baf2b2db94942))

  - The generated `netlify.toml` for both React and Solid used `dir` under
    `[build]`, which is not a valid Netlify configuration key. Per Netlify's
    TanStack Start guide it must be `publish`. Closes #423.
  - The eslint toolchain had `format` and `check` scripts swapped: `format`
    ran prettier in read-only mode while `check` mutated files. Swap them so
    `format` writes (`prettier --write . && eslint --fix`) and `check` is
    read-only (`prettier --check .`). Closes #403.
  - `@tanstack/eslint-config` lists `eslint` as a peer dependency, so eslint
    was not installed by package managers that don't auto-install peers. Add
    `eslint` to `devDependencies` in the eslint toolchain. Closes #417.

## 0.63.8

### Patch Changes

- fix(cli): require Node.js >=20 and surface a clear error on older runtimes ([#438](https://github.com/TanStack/cli/pull/438))

  Older Node versions (e.g. Node 16) lack `events.addAbortListener`, which is
  used transitively by the CLI. Running on those versions produced a cryptic
  `SyntaxError: ... does not provide an export named 'addAbortListener'` during
  module instantiation. Both packages now declare `engines.node: ">=20"` so
  package managers warn at install time, and the CLI bin performs an early
  runtime check that prints an actionable message before any modules load.

  Closes #433

## 0.63.7

### Patch Changes

- chore: bump solid base and example to vite 8 ([#437](https://github.com/TanStack/cli/pull/437))

## 0.63.6

### Patch Changes

- Auto-generated changeset from semantic commits on main.

  - chore: update to TS6.0, fix deprecated tsconfig options (#421) (847b396)

## 0.63.5

### Patch Changes

- Fix demo/example files leaking into projects when users opt out of demo pages. ([#434](https://github.com/TanStack/cli/pull/434))

  - Strip add-on demo support files in `src/lib/`, `src/hooks/`, `src/data/`, `src/components/`, `src/store/`, and any `demo.*` / `demo-*` / `example.*` / `example-*` files.
  - Strip example image assets under `public/`.
  - Generate a minimal base starter (no Header, Footer, ThemeToggle, about page, or styled index page) when declining demo/example pages.
  - Render Better Auth header-user component as `null` when its demo route is excluded, instead of linking to a non-existent route.

  Closes #422, #409.

## 0.63.4

### Patch Changes

- Add anonymous CLI telemetry with command and step tracking, a hidden `--agent` flag for agent-originated invocations, first-run disclosure, and opt-out controls via config, env vars, and `tanstack telemetry` commands. ([`bfcd6f5`](https://github.com/TanStack/cli/commit/bfcd6f566f4376891faa977ad61046c3a1880c7a))

  Deprioritize the Neon add-on in create flows without removing support for the add-on itself.

## 0.63.3

### Patch Changes

- Upgrade to Vite 8 and replace `vite-tsconfig-paths` plugin with native `resolve.tsconfigPaths` option. Fix `useStore` call in AI assistant add-on to pass required selector function. ([#428](https://github.com/TanStack/cli/pull/428))

## 0.63.2

### Patch Changes

- Fix Tanstack Query Integration ([#418](https://github.com/TanStack/cli/pull/418))

## 0.63.1

### Patch Changes

- Fix the Neon add-on Vite plugin template to use the `postgres` export from `vite-plugin-neon-new` so newly scaffolded apps start without import errors and avoid deprecated plugin package warnings. ([`ddfaaaa`](https://github.com/TanStack/cli/commit/ddfaaaac81cdc60965052b82da1f1482155c560c))

## 0.63.0

### Minor Changes

- Update all template dependencies to latest versions. All `@tanstack/*` packages now use `"latest"` in templates and are resolved to pinned exact versions at project generation time via the npm registry. Third-party packages (vite, biome, sentry, clerk, convex, trpc, orpc, drizzle, prisma, zod, etc.) are updated to their current latest semver ranges and standardized across all add-ons. ([`5f47a05`](https://github.com/TanStack/cli/commit/5f47a05d5b00376710945609770a10bf17722661))

## 0.62.3

### Patch Changes

- Auto-generated changeset from semantic commits on main.

  - fix(ci): use direct changeset publish args (b6f5ff5)

## 0.62.2

### Patch Changes

- Make the default base starter minimal (Home + About) for React and Solid, and add a new `blog` template option for both frameworks. ([`f33f8d4`](https://github.com/TanStack/cli/commit/f33f8d4954d9ad6771871257a4e1e58feee9b34d))

  Interactive `create` now prompts for a template when one is not provided, and template id resolution prefers the selected framework when ids overlap.

- Add pnpm build approvals for `esbuild` and `lightningcss` in base app templates and preserve `pnpm.onlyBuiltDependencies` when add-ons add their own entries. ([`16fcd67`](https://github.com/TanStack/cli/commit/16fcd674c0f74c1c62cf97b0042060d5a51981ef))

## 0.62.1

### Patch Changes

- Bump `@content-collections/mdx` in the React base template to `^0.2.2` so new projects install cleanly with React 19. ([`b54e202`](https://github.com/TanStack/cli/commit/b54e202ce56f2aa78a416634155bc22f0cb5cc46))

## 0.62.0

### Minor Changes

- This release pulls together a large batch of improvements across the CLI and scaffolding engine since the last versioning pass. ([`154b25e`](https://github.com/TanStack/cli/commit/154b25eec9a13b9718c44cbed6cb3c8566f2fb11))

  - Modernizes and refreshes the generated React/Solid template experience, including updated starter content and stronger defaults.
  - Improves create flows with better option normalization, stronger guardrails around target directories, and clearer compatibility behavior in router-only mode.
  - Expands scaffolding ergonomics with examples toggles, improved add-on/config handling, and reliability fixes across package-manager and cross-platform paths.
  - Strengthens test and release confidence via e2e/release workflow hardening and broader smoke coverage.
  - Streamlines product surface area by removing the local `create-ui` package and `--ui` command paths from the CLI; visual setup now lives at `https://tanstack.com/builder`.
  - Cleans up docs and custom CLI examples to match the current terminal-first workflow and Builder guidance.

## 0.61.6

### Patch Changes

- Improve the Strapi add-on scaffolding for reliability. ([#323](https://github.com/TanStack/cli/pull/323))

  - Remove brittle post-create shell automation that attempted to clone and bootstrap a sibling Strapi server.
  - Fix Strapi article detail routing to use a consistent file-based route path.
  - Update Strapi add-on guidance to document manual/hosted Strapi setup expectations.

## 0.61.5

### Patch Changes

- Add a continuous development workflow for custom add-on authors. ([`b3cc585`](https://github.com/TanStack/cli/commit/b3cc5851d2b81613e3b024eb7981c440ee5183af))

  - Add `tanstack add-on dev` to watch project files and continuously refresh `.add-on` outputs.
  - Rebuild `.add-on` assets and `add-on.json` automatically when source files change.
  - Document the new add-on development loop in the custom add-on guide.

- Improve scaffold customization and custom add-on authoring flow. ([`5fbf262`](https://github.com/TanStack/cli/commit/5fbf262fe3a0d070e6a78fa2f2a920b176b84480))

  - Add `--examples` / `--no-examples` support to include or omit demo/example pages during app creation.
  - Prompt for add-on-declared environment variables during interactive create and seed entered values into generated `.env.local`.
  - Ensure custom add-on/starter metadata consistently includes a `version`, with safe backfill for older metadata files.
  - Align bundled starter/example metadata and docs with current Start/file-router behavior.

## 0.61.4

### Patch Changes

- Update the React Paraglide Vite plugin strategy to include `baseLocale` alongside `url`, preventing missing-locale routing/rendering errors in generated apps. ([`164522e`](https://github.com/TanStack/cli/commit/164522e444188e83710fc599304132de8cb379e6))

- Improve CLI compatibility and scaffold behavior for legacy router-first workflows. ([`2949819`](https://github.com/TanStack/cli/commit/2949819058b4d4b1760be683ef29bfd459ddb28b))

  - Add safer target directory handling by warning before creating into non-empty folders.
  - Support explicit git initialization control via `--git` and `--no-git`.
  - Restore router-only compatibility mode with file-based routing templates (without Start-dependent add-ons/deployments/starters), while still allowing toolchains.
  - Default `create-tsrouter-app` to router-only compatibility mode.
  - Remove stale `count.txt` ignore entries from base templates.

  Also expands starter documentation with clearer creation, maintenance, UI usage, and banner guidance.

## 0.61.3

### Patch Changes

- Improve generated React scaffold reliability and default lint ergonomics. ([`cc5857c`](https://github.com/TanStack/cli/commit/cc5857c5c212132852f37878e039071c5a9b1ac5))

  - Migrate React template imports to package `imports` aliases (`#/*`) while preserving `@/*` compatibility during transition.
  - Harden eslint toolchain templates for fresh apps by avoiding known parser/project and resolver issues.
  - Fix generated shadcn utility import style for stricter eslint configs.
  - Improve TanStack Form demo select contrast in dark mode.

## 0.61.2

### Patch Changes

- Improve generated app reliability and CLI compatibility. ([`791bef6`](https://github.com/TanStack/cli/commit/791bef6b5472df5b5e2bffe5c1714c4052a97ac3))

  - Fix React Query provider scaffolding (including Query + tRPC combinations) so generated apps build correctly.
  - Fix Prisma add-on package template rendering by exposing package-manager execute helper in `package.json.ejs` context.
  - Restore `--tailwind` and `--no-tailwind` as deprecated compatibility flags that are accepted but ignored with clear warnings.
  - Align CLI/docs examples with the current Tailwind-always-on behavior.
  - Update Convex demo import to type-only `Id` import to avoid runtime resolution issues.

## 0.61.1

### Patch Changes

- add missing .js extensions to ESM imports ([#369](https://github.com/TanStack/cli/pull/369))

## 0.61.0

### Minor Changes

- Add PostHog add-on ([#317](https://github.com/TanStack/cli/pull/317))

## 0.60.1

### Patch Changes

- Pin the React Sentry add-on to `@sentry/tanstackstart-react@10.34.0` to avoid a Nitro production build failure introduced in newer Sentry versions. ([`ab740ed`](https://github.com/TanStack/cli/commit/ab740ed2c5510a3266065aa98c8afe3093ea0034))

## 0.60.0

### Minor Changes

- feat(mcp): add getAddOnDetails tool and expand add-on metadata

  Add new MCP tool to retrieve detailed add-on information including
  routes, package additions, files, and documentation. Also expand
  listTanStackAddOns to include type, category, link, warning, and
  exclusive fields.

- feat: case-insensitive add-on lookup with typo suggestions

- feat: force TanStack Start with Tailwind CSS always enabled

  - Remove code-router mode and --router-only flag (TanStack Start only)
  - Remove start add-on (baked into base templates)
  - Remove module-federation add-on
  - Force Tailwind CSS to always be enabled
  - Remove --tailwind/--no-tailwind CLI flags
  - Remove selectTailwind and selectTypescript prompts
  - Remove forcedMode parameter (mode always file-router)
  - Simplify template conditionals and hardcode typescript/tailwind values
  - Update README.md.ejs with instructions for removing Tailwind
  - Clean up dead code and unused functions
  - Update all CLI wrappers to show deprecation warnings

### Patch Changes

- fix(create): ignore transient vitest unconfig files in templates

  Fixes #345

- fix(create): bump Tailwind deps for Vite 7 compatibility

  Fixes #332

- ci: Version Packages (#346)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>
  Co-authored-by: Tanner Linsley <tannerlinsley@gmail.com>

- ci: Version Packages (#339)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#311)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#313)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>
  Co-authored-by: Tanner Linsley <tannerlinsley@gmail.com>

- ci: Version Packages (#327)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#312)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#349)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- fix: Update Paraglide JS url (#307)

  Co-authored-by: Tanner Linsley <tannerlinsley@gmail.com>

- ci: Version Packages (#341)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- fix: normalize path separators in toCleanPath to fix missing tsconfig.json on Windows (#319)

- ci: Version Packages (#338)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#325)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- fix(create): allow better-sqlite3 builds in pnpm templates

  Set pnpm.onlyBuiltDependencies for React Drizzle and Prisma SQLite templates so better-sqlite3 native bindings build correctly in generated apps.

  Fixes #321

- fix(create): normalize add-to-app output paths on Windows

  Normalize generated and deleted output file paths to project-relative keys before compare/write/delete, preventing duplicated path segments when Windows drive letters are missing.

  Fixes #329

- chore: remove unused Provider function from tanstack-query template (#272)

- fix: resolve Windows path handling in relativePath causing incorrect Clerk imports (#324)

- ci: Version Packages (#335)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#347)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#334)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#336)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- fix(create): normalize generated src js/jsx extensions for TypeScript

- ci: Version Packages (#326)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- fix(neon): use named import for postgresPlugin (#320)

  The @neondatabase/vite-plugin-postgres package exports postgresPlugin as a
  named export, not a default export. This fixes the SyntaxError when running
  pnpm dev on projects created with the Neon add-on.

  Fixes #318

- ci: Version Packages (#337)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

## 0.59.4

### Patch Changes

- Allow `better-sqlite3` build scripts in generated pnpm projects when using the React Drizzle or Prisma SQLite add-ons, preventing runtime native binding errors. ([`dbd3086`](https://github.com/TanStack/cli/commit/dbd308621464d14bbc03158b2972fd061ea6ccb1))

- Fix `tanstack add` on Windows when generated output paths lose the drive letter, preventing duplicated project paths from being written. ([`4f7c925`](https://github.com/TanStack/cli/commit/4f7c9255f365b1993ec91ac447dfcbfe6dd4903d))

## 0.59.3

### Patch Changes

- Update generated React and Solid app template dependencies to use `@tailwindcss/vite` and `tailwindcss` `^4.1.18`, fixing incompatibility with Vite 7. ([`a93d7e5`](https://github.com/TanStack/cli/commit/a93d7e5d43bc1db37f2251bf88de7681c9a7387d))

## 0.59.2

### Patch Changes

- Ignore transient `__unconfig*` files in generated React and Solid app `.gitignore` templates to prevent VS Code Vitest Explorer startup errors caused by temporary config files. ([`2f3c4d7`](https://github.com/TanStack/cli/commit/2f3c4d79b1ecdf8b8404d23e7b25bfbbbf77f48f))

## 0.59.1

### Patch Changes

- Normalize add-on source filenames under `src/` to TypeScript extensions when TypeScript is enabled, converting `.js` to `.ts` and `.jsx` to `.tsx`. ([`0f2744e`](https://github.com/TanStack/cli/commit/0f2744ea4675dbc61ff14ebbe57f77438606b26b))

## 0.59.0

### Minor Changes

- feat: case-insensitive add-on lookup with typo suggestions

- feat(mcp): add getAddOnDetails tool and expand add-on metadata

  Add new MCP tool to retrieve detailed add-on information including
  routes, package additions, files, and documentation. Also expand
  listTanStackAddOns to include type, category, link, warning, and
  exclusive fields.

- feat: force TanStack Start with Tailwind CSS always enabled

  - Remove code-router mode and --router-only flag (TanStack Start only)
  - Remove start add-on (baked into base templates)
  - Remove module-federation add-on
  - Force Tailwind CSS to always be enabled
  - Remove --tailwind/--no-tailwind CLI flags
  - Remove selectTailwind and selectTypescript prompts
  - Remove forcedMode parameter (mode always file-router)
  - Simplify template conditionals and hardcode typescript/tailwind values
  - Update README.md.ejs with instructions for removing Tailwind
  - Clean up dead code and unused functions
  - Update all CLI wrappers to show deprecation warnings

### Patch Changes

- ci: Version Packages (#338)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#311)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#337)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#335)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#327)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#312)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#325)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#326)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#313)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>
  Co-authored-by: Tanner Linsley <tannerlinsley@gmail.com>

- fix: resolve Windows path handling in relativePath causing incorrect Clerk imports (#324)

- ci: Version Packages (#336)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- chore: remove unused Provider function from tanstack-query template (#272)

- fix(neon): use named import for postgresPlugin (#320)

  The @neondatabase/vite-plugin-postgres package exports postgresPlugin as a
  named export, not a default export. This fixes the SyntaxError when running
  pnpm dev on projects created with the Neon add-on.

  Fixes #318

- fix: Update Paraglide JS url (#307)

  Co-authored-by: Tanner Linsley <tannerlinsley@gmail.com>

- fix: normalize path separators in toCleanPath to fix missing tsconfig.json on Windows (#319)

- ci: Version Packages (#334)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

## 0.58.0

### Minor Changes

- feat(mcp): add getAddOnDetails tool and expand add-on metadata

  Add new MCP tool to retrieve detailed add-on information including
  routes, package additions, files, and documentation. Also expand
  listTanStackAddOns to include type, category, link, warning, and
  exclusive fields.

- feat: case-insensitive add-on lookup with typo suggestions

- feat: force TanStack Start with Tailwind CSS always enabled

  - Remove code-router mode and --router-only flag (TanStack Start only)
  - Remove start add-on (baked into base templates)
  - Remove module-federation add-on
  - Force Tailwind CSS to always be enabled
  - Remove --tailwind/--no-tailwind CLI flags
  - Remove selectTailwind and selectTypescript prompts
  - Remove forcedMode parameter (mode always file-router)
  - Simplify template conditionals and hardcode typescript/tailwind values
  - Update README.md.ejs with instructions for removing Tailwind
  - Clean up dead code and unused functions
  - Update all CLI wrappers to show deprecation warnings

### Patch Changes

- ci: Version Packages (#325)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#336)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- fix: Update Paraglide JS url (#307)

  Co-authored-by: Tanner Linsley <tannerlinsley@gmail.com>

- fix(neon): use named import for postgresPlugin (#320)

  The @neondatabase/vite-plugin-postgres package exports postgresPlugin as a
  named export, not a default export. This fixes the SyntaxError when running
  pnpm dev on projects created with the Neon add-on.

  Fixes #318

- ci: Version Packages (#313)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>
  Co-authored-by: Tanner Linsley <tannerlinsley@gmail.com>

- ci: Version Packages (#334)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#335)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#326)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#312)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#311)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#337)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#327)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- chore: remove unused Provider function from tanstack-query template (#272)

- fix: resolve Windows path handling in relativePath causing incorrect Clerk imports (#324)

- fix: normalize path separators in toCleanPath to fix missing tsconfig.json on Windows (#319)

## 0.57.0

### Minor Changes

- feat: force TanStack Start with Tailwind CSS always enabled

  - Remove code-router mode and --router-only flag (TanStack Start only)
  - Remove start add-on (baked into base templates)
  - Remove module-federation add-on
  - Force Tailwind CSS to always be enabled
  - Remove --tailwind/--no-tailwind CLI flags
  - Remove selectTailwind and selectTypescript prompts
  - Remove forcedMode parameter (mode always file-router)
  - Simplify template conditionals and hardcode typescript/tailwind values
  - Update README.md.ejs with instructions for removing Tailwind
  - Clean up dead code and unused functions
  - Update all CLI wrappers to show deprecation warnings

- feat: case-insensitive add-on lookup with typo suggestions

- feat(mcp): add getAddOnDetails tool and expand add-on metadata

  Add new MCP tool to retrieve detailed add-on information including
  routes, package additions, files, and documentation. Also expand
  listTanStackAddOns to include type, category, link, warning, and
  exclusive fields.

### Patch Changes

- ci: Version Packages (#313)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>
  Co-authored-by: Tanner Linsley <tannerlinsley@gmail.com>

- chore: remove unused Provider function from tanstack-query template (#272)

- ci: Version Packages (#311)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#336)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- fix: normalize path separators in toCleanPath to fix missing tsconfig.json on Windows (#319)

- ci: Version Packages (#327)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- fix: Update Paraglide JS url (#307)

  Co-authored-by: Tanner Linsley <tannerlinsley@gmail.com>

- ci: Version Packages (#325)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- fix(neon): use named import for postgresPlugin (#320)

  The @neondatabase/vite-plugin-postgres package exports postgresPlugin as a
  named export, not a default export. This fixes the SyntaxError when running
  pnpm dev on projects created with the Neon add-on.

  Fixes #318

- ci: Version Packages (#334)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#326)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#335)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- fix: resolve Windows path handling in relativePath causing incorrect Clerk imports (#324)

- ci: Version Packages (#312)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

## 0.56.0

### Minor Changes

- feat(mcp): add getAddOnDetails tool and expand add-on metadata

  Add new MCP tool to retrieve detailed add-on information including
  routes, package additions, files, and documentation. Also expand
  listTanStackAddOns to include type, category, link, warning, and
  exclusive fields.

- feat: case-insensitive add-on lookup with typo suggestions

- feat: force TanStack Start with Tailwind CSS always enabled

  - Remove code-router mode and --router-only flag (TanStack Start only)
  - Remove start add-on (baked into base templates)
  - Remove module-federation add-on
  - Force Tailwind CSS to always be enabled
  - Remove --tailwind/--no-tailwind CLI flags
  - Remove selectTailwind and selectTypescript prompts
  - Remove forcedMode parameter (mode always file-router)
  - Simplify template conditionals and hardcode typescript/tailwind values
  - Update README.md.ejs with instructions for removing Tailwind
  - Clean up dead code and unused functions
  - Update all CLI wrappers to show deprecation warnings

### Patch Changes

- ci: Version Packages (#325)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#335)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- fix(neon): use named import for postgresPlugin (#320)

  The @neondatabase/vite-plugin-postgres package exports postgresPlugin as a
  named export, not a default export. This fixes the SyntaxError when running
  pnpm dev on projects created with the Neon add-on.

  Fixes #318

- fix: Update Paraglide JS url (#307)

  Co-authored-by: Tanner Linsley <tannerlinsley@gmail.com>

- ci: Version Packages (#312)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- fix: resolve Windows path handling in relativePath causing incorrect Clerk imports (#324)

- ci: Version Packages (#326)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- fix: normalize path separators in toCleanPath to fix missing tsconfig.json on Windows (#319)

- ci: Version Packages (#311)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#313)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>
  Co-authored-by: Tanner Linsley <tannerlinsley@gmail.com>

- ci: Version Packages (#334)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- chore: remove unused Provider function from tanstack-query template (#272)

- ci: Version Packages (#327)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

## 0.55.0

### Minor Changes

- feat(mcp): add getAddOnDetails tool and expand add-on metadata

  Add new MCP tool to retrieve detailed add-on information including
  routes, package additions, files, and documentation. Also expand
  listTanStackAddOns to include type, category, link, warning, and
  exclusive fields.

- feat: case-insensitive add-on lookup with typo suggestions

- feat: force TanStack Start with Tailwind CSS always enabled

  - Remove code-router mode and --router-only flag (TanStack Start only)
  - Remove start add-on (baked into base templates)
  - Remove module-federation add-on
  - Force Tailwind CSS to always be enabled
  - Remove --tailwind/--no-tailwind CLI flags
  - Remove selectTailwind and selectTypescript prompts
  - Remove forcedMode parameter (mode always file-router)
  - Simplify template conditionals and hardcode typescript/tailwind values
  - Update README.md.ejs with instructions for removing Tailwind
  - Clean up dead code and unused functions
  - Update all CLI wrappers to show deprecation warnings

### Patch Changes

- ci: Version Packages (#327)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#313)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>
  Co-authored-by: Tanner Linsley <tannerlinsley@gmail.com>

- chore: remove unused Provider function from tanstack-query template (#272)

- ci: Version Packages (#326)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#311)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- fix: resolve Windows path handling in relativePath causing incorrect Clerk imports (#324)

- ci: Version Packages (#312)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#334)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- fix(neon): use named import for postgresPlugin (#320)

  The @neondatabase/vite-plugin-postgres package exports postgresPlugin as a
  named export, not a default export. This fixes the SyntaxError when running
  pnpm dev on projects created with the Neon add-on.

  Fixes #318

- fix: Update Paraglide JS url (#307)

  Co-authored-by: Tanner Linsley <tannerlinsley@gmail.com>

- fix: normalize path separators in toCleanPath to fix missing tsconfig.json on Windows (#319)

- ci: Version Packages (#325)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

## 0.54.0

### Minor Changes

- feat(mcp): add getAddOnDetails tool and expand add-on metadata

  Add new MCP tool to retrieve detailed add-on information including
  routes, package additions, files, and documentation. Also expand
  listTanStackAddOns to include type, category, link, warning, and
  exclusive fields.

- feat: case-insensitive add-on lookup with typo suggestions

- feat: force TanStack Start with Tailwind CSS always enabled

  - Remove code-router mode and --router-only flag (TanStack Start only)
  - Remove start add-on (baked into base templates)
  - Remove module-federation add-on
  - Force Tailwind CSS to always be enabled
  - Remove --tailwind/--no-tailwind CLI flags
  - Remove selectTailwind and selectTypescript prompts
  - Remove forcedMode parameter (mode always file-router)
  - Simplify template conditionals and hardcode typescript/tailwind values
  - Update README.md.ejs with instructions for removing Tailwind
  - Clean up dead code and unused functions
  - Update all CLI wrappers to show deprecation warnings

### Patch Changes

- ci: Version Packages (#313)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>
  Co-authored-by: Tanner Linsley <tannerlinsley@gmail.com>

- fix(neon): use named import for postgresPlugin (#320)

  The @neondatabase/vite-plugin-postgres package exports postgresPlugin as a
  named export, not a default export. This fixes the SyntaxError when running
  pnpm dev on projects created with the Neon add-on.

  Fixes #318

- fix: resolve Windows path handling in relativePath causing incorrect Clerk imports (#324)

- ci: Version Packages (#325)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#326)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#327)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#311)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#312)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- fix: Update Paraglide JS url (#307)

  Co-authored-by: Tanner Linsley <tannerlinsley@gmail.com>

- chore: remove unused Provider function from tanstack-query template (#272)

- fix: normalize path separators in toCleanPath to fix missing tsconfig.json on Windows (#319)

## 0.53.2

### Patch Changes

- Add case-insensitive add-on ID matching and "did you mean?" suggestions for typos ([`61011ec`](https://github.com/TanStack/cli/commit/61011ec171283cd6de020e2cb6ac9f943a3aa47b))

- fix: normalize path separators in toCleanPath to fix missing tsconfig.json on Windows ([`2cf6703`](https://github.com/TanStack/cli/commit/2cf6703a082d0441f96f599eab21559b05742f92))

- chore: remove unused Provider function from tanstack-query root-provider template ([`46a4903`](https://github.com/TanStack/cli/commit/46a49033547f7e6c9905f4e94cca07ce0988f63a))

## 0.53.1

### Patch Changes

- fix: resolve Windows path handling in relativePath causing incorrect Clerk imports ([`72049cb`](https://github.com/TanStack/cli/commit/72049cb134f9ecd169da161154899cc84a5c39b8))

## 0.53.0

### Minor Changes

- force tailwind, force typescript ([`337eeba`](https://github.com/TanStack/cli/commit/337eebaafa190de96194910b6c8c9e550ca142fc))

## 0.52.0

### Minor Changes

- feat(mcp): add getAddOnDetails tool and expand add-on metadata

  Add new MCP tool to retrieve detailed add-on information including
  routes, package additions, files, and documentation. Also expand
  listTanStackAddOns to include type, category, link, warning, and
  exclusive fields.

### Patch Changes

- fix: Update Paraglide JS url (#307)

  Co-authored-by: Tanner Linsley <tannerlinsley@gmail.com>

- ci: Version Packages (#311)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#312)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

## 0.51.0

### Minor Changes

- feat(mcp): add getAddOnDetails tool and expand add-on metadata

  Add new MCP tool to retrieve detailed add-on information including
  routes, package additions, files, and documentation. Also expand
  listTanStackAddOns to include type, category, link, warning, and
  exclusive fields.

### Patch Changes

- fix: Update Paraglide JS url (#307)

  Co-authored-by: Tanner Linsley <tannerlinsley@gmail.com>

- ci: Version Packages (#311)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

## 0.50.0

### Minor Changes

- feat(mcp): add getAddOnDetails tool and expand add-on metadata

  Add new MCP tool to retrieve detailed add-on information including
  routes, package additions, files, and documentation. Also expand
  listTanStackAddOns to include type, category, link, warning, and
  exclusive fields.

## 0.49.3

### Patch Changes

- fix: do not exclude .ts files in asset transfer ([`30edd20`](https://github.com/TanStack/cli/commit/30edd208fd81b5c501fa42cd476232273ff108d1))

## 0.49.2

### Patch Changes

- Fixed windows \\ delimiter stripping ([`7940300`](https://github.com/TanStack/cli/commit/79403004689817339ec6f6e03c20fb25e841ddb0))
