# Architecture

## Terminology

| Term | Definition |
|------|------------|
| **Add-on** | Plugin that extends apps (e.g., `clerk`, `drizzle`). Contains code, dependencies, and hooks. |
| **Starter** | Reusable preset of add-ons. Contains only configuration, no code. |
| **Framework** | React or Solid implementation in `packages/create/src/frameworks/` |
| **Mode** | `file-router` (file-based routes) or `code-router` (routes defined in code) |

## Packages

| Package | Purpose |
|---------|---------|
| `@tanstack/cli` | Main CLI with commands: `create`, `add`, `add-on`, `starter`, `libraries`, `doc`, `search-docs`, `ecosystem` |
| `@tanstack/create` | Core engine, frameworks, and add-ons |

## Framework Structure

```
packages/create/src/frameworks/
├── react/
│   ├── project/base/      # Base project template
│   ├── add-ons/           # Add-on implementations
│   ├── toolchains/        # eslint, biome
│   ├── hosts/             # vercel, netlify, cloudflare
│   └── examples/          # Demo projects
└── solid/
    └── (same structure)
```

## EJS Template Variables

Templates (`.ejs` files) have access to:

| Variable | Type | Description |
|----------|------|-------------|
| `projectName` | `string` | Project name |
| `typescript` | `boolean` | TypeScript enabled |
| `tailwind` | `boolean` | Tailwind enabled |
| `fileRouter` | `boolean` | File-based routing mode |
| `codeRouter` | `boolean` | Code-based routing mode |
| `addOnEnabled` | `Record<string, boolean>` | Map of enabled add-on IDs |
| `addOnOption` | `Record<string, object>` | Add-on configuration options |
| `addOns` | `Array<AddOn>` | Full add-on objects |
| `routes` | `Array<Route>` | All routes from enabled add-ons |
| `integrations` | `Array<Integration>` | All integrations (providers, plugins) |
| `packageManager` | `string` | `npm`, `pnpm`, `yarn`, `bun`, `deno` |
| `js` | `string` | `ts` or `js` |
| `jsx` | `string` | `tsx` or `jsx` |

## Helper Functions

| Function | Description |
|----------|-------------|
| `ignoreFile()` | Skip generating this file |
| `relativePath(target, stripExt?)` | Calculate relative import path |
| `getPackageManagerAddScript(pkg, isDev?)` | Get install command |
| `getPackageManagerRunScript(script, args?)` | Get run command |

## File Naming Conventions

| Pattern | Result |
|---------|--------|
| `file.ts` | Copied as-is |
| `file.ts.ejs` | EJS processed, outputs `file.ts` |
| `_dot_gitignore` | Becomes `.gitignore` |
| `file.ts.append` | Appended to existing file |
| `__option__file.ts` | Only included if option selected |

## Add-on info.json

```json
{
  "name": "My Add-on",
  "description": "What it does",
  "type": "add-on",           // add-on | toolchain | deployment | example
  "phase": "add-on",          // setup | add-on | example
  "modes": ["file-router"],   // Supported modes
  "priority": 100,            // Execution order (lower = earlier)
  
  "dependsOn": ["tanstack-query"],
  "conflicts": ["other-addon"],
  
  "routes": [{
    "url": "/demo/feature",
    "name": "Feature Demo",
    "path": "src/routes/demo.feature.tsx",
    "jsName": "FeatureDemo"
  }],
  
  "integrations": [{
    "type": "provider",       // provider | root-provider | vite-plugin | devtools | header-user | layout
    "jsName": "MyProvider",
    "path": "src/integrations/my-addon/provider.tsx"
  }],
  
  "options": {
    "database": {
      "type": "select",
      "label": "Database",
      "default": "postgres",
      "options": [
        { "value": "postgres", "label": "PostgreSQL" },
        { "value": "sqlite", "label": "SQLite" }
      ]
    }
  }
}
```

## Integration Types

| Type | Location | Purpose |
|------|----------|---------|
| `provider` | Wraps app in `__root.tsx` | Basic context providers |
| `root-provider` | Wraps app, exports context | Providers with shared state |
| `vite-plugin` | `vite.config.ts` | Vite plugins |
| `devtools` | After app in `__root.tsx` | Developer tools |
| `header-user` | Header component | Auth UI, user menus |
| `layout` | Layout wrapper | Dashboard layouts |

## Priority Ranges

| Range | Use Case |
|-------|----------|
| 0-10 | Toolchains (eslint, biome) |
| 20-30 | Core libraries (start, query) |
| 30-50 | UI foundations (shadcn, form) |
| 100-150 | Feature add-ons (clerk, sentry) |
| 170-200 | Deployment (netlify, cloudflare) |
