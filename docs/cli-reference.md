---
id: cli-reference
title: CLI Reference
---

## tanstack create

Create a new TanStack application. By default creates a TanStack Start app with SSR.

```bash
tanstack create [project-name] [options]
```

| Option | Description |
|--------|-------------|
| `--add-ons <ids>` | Comma-separated add-on IDs |
| `--template <url-or-id>` | Template URL/path or built-in template ID |
| `--package-manager <pm>` | `npm`, `pnpm`, `yarn`, `bun`, `deno` |
| `--framework <name>` | `React`, `Solid` |
| `--router-only` | Create file-based Router-only app without TanStack Start (add-ons/deployment/template disabled) |
| `--toolchain <id>` | Toolchain add-on (use `--list-add-ons` to see options) |
| `--deployment <id>` | Deployment add-on (use `--list-add-ons` to see options) |
| `--examples` / `--no-examples` | Include or exclude demo/example pages |
| `--tailwind` / `--no-tailwind` | Deprecated compatibility flags; accepted but ignored (Tailwind is always enabled) |
| `--no-git` | Skip git init |
| `--no-install` | Skip dependency install |
| `-y, --yes` | Use defaults, skip prompts |
| `--interactive` | Force interactive mode |
| `--target-dir <path>` | Custom output directory |
| `-f, --force` | Overwrite existing directory |
| `--list-add-ons` | List all available add-ons |
| `--addon-details <id>` | Show details for specific add-on |
| `--json` | Output machine-readable JSON for automation |
| `--add-on-config <json>` | JSON string with add-on options |

```bash
# Examples
tanstack create my-app -y
tanstack create my-app --add-ons clerk,drizzle,tanstack-query
tanstack create my-app --router-only --toolchain eslint --no-examples
tanstack create my-app --template https://example.com/template.json
tanstack create my-app --template ecommerce
tanstack create --list-add-ons --framework React --json
tanstack create --addon-details drizzle --framework React --json
```

### Programmatic generation

Use `@tanstack/create/worker` in Cloudflare Workers and other edge SSR runtimes. It does not import the generated template manifest at module startup. Instead, provide a loader for the framework and add-on chunks your Worker supports.

The default `@tanstack/create` export is still the Node/CLI path and scans framework templates from disk. `@tanstack/create/edge` remains the bundled in-memory manifest path; it is Worker-compatible at runtime, but it imports the full generated manifest and is not appropriate for size-constrained Worker bundles.

```ts
import {
  createMemoryEnvironment,
  createWorkerCreate,
  createWorkerManifestLoader,
} from '@tanstack/create/worker'
import { manifestCatalog } from '@tanstack/create/worker-manifest/catalog'

import type {
  WorkerAddOnManifestModule,
  WorkerFrameworkManifestModule,
} from '@tanstack/create/worker'

const frameworkLoaders: Record<
  string,
  () => Promise<WorkerFrameworkManifestModule>
> = {
  react: () => import('@tanstack/create/worker-manifest/frameworks/react'),
}

const addOnLoaders: Record<
  string,
  Record<string, () => Promise<WorkerAddOnManifestModule>>
> = {
  react: {
    'tanstack-query': () =>
      import(
        '@tanstack/create/worker-manifest/frameworks/react/add-ons/tanstack-query'
      ),
    cloudflare: () =>
      import(
        '@tanstack/create/worker-manifest/frameworks/react/add-ons/cloudflare'
      ),
  },
}

const create = createWorkerCreate(
  createWorkerManifestLoader({
    loadCatalog: async () => manifestCatalog,
    async loadFramework(frameworkId) {
      const load = frameworkLoaders[frameworkId]
      if (!load) throw new Error(`Unsupported framework: ${frameworkId}`)
      return load()
    },
    async loadAddOn(frameworkId, addOnId) {
      const load = addOnLoaders[frameworkId]?.[addOnId]
      if (!load) throw new Error(`Unsupported add-on: ${addOnId}`)
      return load()
    },
  }),
)

const framework = await create.getFrameworkById('react')
const chosenAddOns = await create.finalizeAddOns(framework!, 'file-router', [
  'tanstack-query',
  'cloudflare',
])
const addOnOptions = create.populateAddOnOptionsDefaults(chosenAddOns)
const { environment, output } = createMemoryEnvironment('/app')

await create.createApp(environment, {
  projectName: 'app',
  targetDir: '/app',
  framework: framework!,
  mode: 'file-router',
  typescript: true,
  tailwind: true,
  packageManager: 'pnpm',
  git: false,
  install: false,
  intent: false,
  chosenAddOns,
  addOnOptions,
})

// output.files contains generated files for ZIP creation.
```

---

## tanstack add

Add add-ons to an existing project.

```bash
tanstack add [add-on...] [options]
```

| Option | Description |
|--------|-------------|
| `--forced` | Force add-on installation even if conflicts exist |

```bash
# Examples
tanstack add clerk drizzle
tanstack add tanstack-query,tanstack-form
```

Visual setup is available at `https://tanstack.com/builder`.

---

## tanstack add-on

Create and manage custom add-ons.

### init

Extract add-on from current project:

```bash
tanstack add-on init
```

Creates `.add-on/` folder with `info.json` and `assets/`.

### compile

Rebuild after changes:

```bash
tanstack add-on compile
```

See [Creating Add-ons](./creating-add-ons.md) for full guide.

---

## tanstack template

Create reusable project templates.

### init

```bash
tanstack template init
```

Creates `template-info.json` and `template.json`.

### compile

```bash
tanstack template compile
```

See [Templates](./templates.md) for full guide.

## tanstack libraries

List TanStack libraries with optional group filtering.

```bash
tanstack libraries [options]
```

| Option | Description |
|--------|-------------|
| `--group <group>` | Filter by group: `state`, `headlessUI`, `performance`, `tooling` |
| `--json` | Output machine-readable JSON |

```bash
tanstack libraries
tanstack libraries --group state --json
```

---

## tanstack doc

Fetch a TanStack documentation page by library and path.

```bash
tanstack doc <library> <path> [options]
```

| Option | Description |
|--------|-------------|
| `--docs-version <version>` | Docs version (default: `latest`) |
| `--json` | Output machine-readable JSON |

```bash
tanstack doc router framework/react/guide/data-loading
tanstack doc query framework/react/overview --docs-version v5 --json
```

---

## tanstack search-docs

Search TanStack documentation.

```bash
tanstack search-docs <query> [options]
```

| Option | Description |
|--------|-------------|
| `--library <id>` | Filter by library ID |
| `--framework <name>` | Filter by framework |
| `--limit <n>` | Max results (default `10`, max `50`) |
| `--json` | Output machine-readable JSON |

```bash
tanstack search-docs "server functions" --library start
tanstack search-docs loaders --library router --framework react --json
```

---

## tanstack ecosystem

List ecosystem partner recommendations.

```bash
tanstack ecosystem [options]
```

| Option | Description |
|--------|-------------|
| `--category <category>` | Filter by category |
| `--library <id>` | Filter by TanStack library |
| `--json` | Output machine-readable JSON |

```bash
tanstack ecosystem --category database
tanstack ecosystem --library router --json
```

---

## tanstack pin-versions

Pin TanStack package versions to avoid conflicts.

```bash
tanstack pin-versions
```

Removes `^` from version ranges for TanStack packages and adds any missing peer dependencies.

---

## Configuration

Projects include `.tanstack.json`:

```json
{
  "version": 1,
  "projectName": "my-app",
  "framework": "react",
  "mode": "file-router",
  "typescript": true,
  "tailwind": true,
  "packageManager": "pnpm",
  "chosenAddOns": ["tanstack-query", "clerk"]
}
```

Used by `add-on init` and `template init` to detect changes.
