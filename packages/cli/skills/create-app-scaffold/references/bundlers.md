# Build Tool Options

Targets `@tanstack/cli` v0.71.0.

## Supported values

- `vite` (default)
- `rsbuild`

## Usage

```bash
npx @tanstack/cli create app --framework react --build-tool vite -y
npx @tanstack/cli create app --framework solid --build-tool rsbuild -y
```

Rsbuild supports full TanStack Start and router-only projects, including the
standard and `--blank` presets, built-in example pages, Tailwind, ESLint,
Biome, and Prettier. Templates and catalog business/example add-ons are not
supported.

Full Start projects support `--deployment nitro`, `railway`, `render`,
`vercel`, `netlify`, and `cloudflare` through the experimental `nitro/rsbuild`
integration. These projects require Node.js >=22.22 and Rsbuild >=2.3.
Router-only projects do not support deployment adapters. Existing Rsbuild
Start projects can add one deployment adapter with `tanstack add`.

```bash
npx @tanstack/cli create app --build-tool rsbuild --deployment nitro -y
```

Use the build-tool-aware catalog view before constructing an Rsbuild command:

```bash
npx @tanstack/cli create --list-add-ons --build-tool rsbuild --json
```
