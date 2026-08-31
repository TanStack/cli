# Deployment Provider Options

Targets `@tanstack/cli` v0.61.0.

## Common providers

- `cloudflare`
- `netlify`
- `railway`
- `render`
- `nitro`

## Usage

```bash
npx @tanstack/cli create app --deployment cloudflare -y
npx @tanstack/cli create app --deployment netlify -y
```

Deployment providers are exclusive; choose one per scaffold.
