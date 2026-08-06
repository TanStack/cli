---
id: quick-start
title: Quick Start
---

## Create a Project

```bash
npx @tanstack/cli create my-app
```

Interactive prompts guide you through project name, package manager, and add-on selection.

## Non-Interactive

```bash
# Defaults only (TanStack Start + file-router)
npx @tanstack/cli create my-app -y

# Minimal one-route Start project
npx @tanstack/cli create my-app --blank -y

# Minimal Start project configured for Cloudflare
npx @tanstack/cli create my-app --blank --deployment cloudflare -y

# With add-ons
npx @tanstack/cli create my-app --add-ons tanstack-query,clerk,drizzle -y

# Router-only SPA (no SSR)
npx @tanstack/cli create my-app --router-only -y
```

Blank projects omit the default starter interface, examples, Tailwind,
devtools, test stack, and TanStack Intent setup. Pass `--intent` to include
local skill mappings for coding agents. Explicit add-ons can add their own
required files and dependencies. Pass `-y` to skip selection prompts. A
non-empty target also requires `--force`.

## Run the Project

```bash
cd my-app
pnpm dev
# Open http://localhost:3000
```

## Environment Variables

Some add-ons require API keys. When the project includes `.env.example`:

```bash
cp .env.example .env
# Edit .env with your values
```

## Project Structure

```
my-app/
├── src/
│   ├── routes/          # File-based routing
│   │   ├── __root.tsx   # Root layout
│   │   └── index.tsx    # Home page
│   └── integrations/    # Present when selected add-ons need it
├── .cta.json            # CLI config
└── .env.example         # Present when selected add-ons need env vars
```

## Next Steps

- [CLI Reference](./cli-reference.md) - All options
- [Add-ons](./add-ons.md) - Available add-ons
