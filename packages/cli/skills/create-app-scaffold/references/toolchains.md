# Toolchain Options

Targets `@tanstack/cli` v0.61.0.

## Supported values

- `eslint`
- `biome`
- `oxlint`

## Usage

```bash
npx @tanstack/cli create app --toolchain eslint -y
npx @tanstack/cli create app --toolchain biome -y
npx @tanstack/cli create app --toolchain oxlint -y
```

Toolchain choices are exclusive and affect generated lint configuration.
