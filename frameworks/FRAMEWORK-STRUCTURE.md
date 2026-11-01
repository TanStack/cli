# Framework Authoring Guide

This guide covers creating and customizing frameworks, add-ons, and starters for the TanStack CLI.

## Directory Structure

```
packages/create/src/frameworks/
├── react/
│   ├── src/index.ts          # Framework registration
│   ├── project/
│   │   ├── base/             # Base project template
│   │   └── packages.json     # Conditional dependencies
│   ├── add-ons/              # Feature add-ons
│   ├── toolchains/           # eslint, biome
│   ├── hosts/                # Deployment adapters
│   └── examples/             # Demo projects
└── solid/
    └── (same structure)
```

## Add-on Structure

```
add-on-name/
├── info.json                 # Metadata (required)
├── package.json              # Dependencies
├── README.md
├── small-logo.svg            # 128x128 for UI
└── assets/                   # Files to inject
    ├── src/
    │   ├── integrations/     # Integration code
    │   └── routes/           # Demo routes
    └── _dot_env.local.append # Env vars
```

## info.json Reference

### Required Fields

```json
{
  "name": "My Add-on",
  "description": "What it does",
  "type": "add-on",
  "phase": "add-on",
  "modes": ["file-router", "code-router"]
}
```

| Field | Values |
|-------|--------|
| `type` | `add-on`, `toolchain`, `deployment`, `example` |
| `phase` | `setup` (toolchains), `add-on`, `example` |
| `modes` | Array of `file-router`, `code-router` |

### Optional Fields

```json
{
  "priority": 100,
  "link": "https://docs.example.com",
  "dependsOn": ["tanstack-query"],
  "conflicts": ["other-addon"],
  "shadcnComponents": ["button", "card"]
}
```

### Routes

```json
{
  "routes": [{
    "url": "/demo/feature",
    "name": "Feature Demo",
    "icon": "Sparkles",
    "path": "src/routes/demo.feature.tsx",
    "jsName": "FeatureDemo"
  }]
}
```

| Property | Required | Description |
|----------|----------|-------------|
| `url` | No | URL path; omit for hidden routes |
| `name` | No | Header link text |
| `icon` | No | Lucide icon name |
| `path` | Yes | File path |
| `jsName` | Yes | Component export name |

### Integrations

```json
{
  "integrations": [{
    "type": "provider",
    "jsName": "MyProvider",
    "path": "src/integrations/my-addon/provider.tsx"
  }]
}
```

| Type | Location | Purpose |
|------|----------|---------|
| `provider` | Wraps app | Basic context providers |
| `root-provider` | Wraps app | Providers with exported context |
| `vite-plugin` | vite.config | Build plugins |
| `devtools` | After app | Developer tools |
| `header-user` | Header | Auth UI, user menus |
| `layout` | Layout wrapper | Dashboard layouts |

**Vite plugin (inline):**
```json
{
  "type": "vite-plugin",
  "import": "import { plugin } from 'my-plugin'",
  "code": "plugin({ option: true })"
}
```

### Options

```json
{
  "options": {
    "database": {
      "type": "select",
      "label": "Database",
      "description": "Choose your database",
      "default": "postgres",
      "options": [
        { "value": "postgres", "label": "PostgreSQL" },
        { "value": "sqlite", "label": "SQLite" }
      ]
    }
  }
}
```

Access in templates: `addOnOption.myAddon.database`

## EJS Templates

Files ending in `.ejs` are processed through EJS before output.

### Available Variables

| Variable | Type | Description |
|----------|------|-------------|
| `projectName` | string | Project name |
| `typescript` | boolean | TypeScript enabled |
| `tailwind` | boolean | Tailwind enabled |
| `fileRouter` | boolean | File-based routing |
| `codeRouter` | boolean | Code-based routing |
| `addOnEnabled` | object | `{ [id]: boolean }` |
| `addOnOption` | object | `{ [id]: options }` |
| `packageManager` | string | npm/pnpm/yarn/bun/deno |
| `js` | string | `ts` or `js` |
| `jsx` | string | `tsx` or `jsx` |

### Helper Functions

```ejs
<%# Skip file if condition not met %>
<% if (!addOnEnabled.prisma) { ignoreFile() } %>

<%# Relative import path %>
import { utils } from '<%= relativePath('./src/lib/utils') %>'

<%# Package manager commands %>
Run: <%= getPackageManagerAddScript('lodash') %>
Run: <%= getPackageManagerRunScript('dev') %>
```

### File Patterns

| Pattern | Result |
|---------|--------|
| `file.ts` | Copied as-is |
| `file.ts.ejs` | EJS processed → `file.ts` |
| `_dot_gitignore` | → `.gitignore` |
| `_dot_env.local.append` | Appended to `.env.local` |
| `__postgres__schema.ts` | Only if option selected |

### Examples

**Conditional TypeScript:**
```ejs
<% if (typescript) { %>
interface Props { name: string }
<% } %>

export default function Component(<% if (typescript) { %>{ name }: Props<% } else { %>{ name }<% } %>) {
  return <div>{name}</div>
}
```

**Conditional imports:**
```ejs
<% if (addOnEnabled.clerk) { %>
import { useAuth } from '@clerk/react'
<% } %>
```

**Router mode handling:**
```ejs
<% if (fileRouter) { %>
import { createFileRoute } from '@tanstack/react-router'
export const Route = createFileRoute('/demo')({ component: Demo })
<% } %>
export default function Demo() { return <div>Demo</div> }
```

## Component Types

| Type | `type` | `phase` | Priority |
|------|--------|---------|----------|
| Toolchain | `toolchain` | `setup` | 0-10 |
| Add-on | `add-on` | `add-on` | 26-150 |
| Deployment | `deployment` | `add-on` | 170-200 |
| Example | `example` | `example` | - |

## Creating an Add-on

1. Create base project and add your feature
2. Run `tanstack add-on init`
3. Edit `.add-on/info.json`
4. Run `tanstack add-on compile`
5. Test: `npx serve .add-on -l 9080`
6. Use: `tanstack create test --add-ons http://localhost:9080/info.json`

## Creating a Template

1. Create project with desired add-ons
2. Run `tanstack template init`
3. Edit `template-info.json`
4. Run `tanstack template compile`
5. Use: `tanstack create my-app --template ./template.json`

## Testing

```bash
# Watch mode
pnpm dev

# Create test project
rm -rf test && node packages/cli/dist/index.js create test --add-ons my-addon

# Dev mode for built-in templates/add-ons
node packages/cli/dist/index.js dev test-app --framework React

# Legacy direct watch path mode
node packages/cli/dist/index.js create --dev-watch ./packages/create/src/frameworks/react test-app
```
