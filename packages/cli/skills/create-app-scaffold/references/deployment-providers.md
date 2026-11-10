# Deployment Provider Options

Targets `@tanstack/cli` v0.61.0.

## Common providers

- `cloudflare`
- `netlify`
- `railway`
- `render`
- `vercel`
- `nitro`

## Usage

```bash
npx @tanstack/cli create app --deployment cloudflare -y
npx @tanstack/cli create app --deployment netlify -y
npx @tanstack/cli create app --deployment vercel -y
```

Deployment providers are exclusive; choose one per scaffold.

## Rsbuild

The same deployment ids are available for full TanStack Start projects with
`--build-tool rsbuild`. They use Nitro's experimental Rsbuild integration
and require Node.js >=22.22 and Rsbuild >=2.3. Router-only projects do not
support deployment adapters.
