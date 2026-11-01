# Create Flag Compatibility Matrix

Targets `@tanstack/cli` v0.71.0.

## Compatibility

| Flag | Works with normal create | Works with `--router-only` | Notes |
|---|---|---|---|
| `--framework` | yes | yes | Framework is still honored in both modes. |
| `--build-tool` | yes | yes | `vite` is the default; `rsbuild` supports React and Solid. |
| `--toolchain` | yes | yes | Toolchain selection remains available. |
| `--add-ons` | yes | no | Ignored in router-only mode. |
| `--deployment` | yes | no | Ignored in router-only mode. |
| `--template` / `--starter` | yes | no | Ignored in router-only mode. |
| `--template-id` | yes | no | Ignored in router-only mode. |
| `--blank` | yes | yes | Omits starter UI, examples, Tailwind, devtools, and test tooling unless an explicit integration requires them. Cannot be combined with a template, `--examples`, or `--tailwind`. |
| `--tailwind` / `--no-tailwind` | deprecated/ignored | deprecated/ignored | Standard scaffolds enable Tailwind; use `--blank` for the supported minimal preset. |

With `--build-tool rsbuild`, only toolchain catalog entries are compatible.
Templates, deployments, and business/example add-ons are rejected. Built-in
demo pages controlled by `--examples` remain available.

Source: `packages/cli/src/command-line.ts:337`

## Recommended command construction order

1. Choose framework and build tool.
2. Choose mode (`--router-only` or full scaffold).
3. If using Vite full scaffold, resolve add-ons, template, and deployment.
4. Add the toolchain and use `-y` only after flags are final.

## Safe presets

```bash
# Full scaffold preset
npx @tanstack/cli create app --framework react --add-ons tanstack-query --deployment netlify -y

# Minimal Start preset
npx @tanstack/cli create app --blank --framework react --deployment cloudflare -y

# Router-only preset
npx @tanstack/cli create app --router-only --framework react --toolchain biome -y

# Rsbuild preset
npx @tanstack/cli create app --framework solid --build-tool rsbuild --toolchain biome -y
```
