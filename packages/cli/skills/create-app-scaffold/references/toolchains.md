# Toolchain Options

Targets `@tanstack/cli` v0.61.0.

## Supported values

- `eslint`
- `biome`

## Usage

```bash
npx @tanstack/cli create app --toolchain eslint -y
npx @tanstack/cli create app --toolchain biome -y
```

Toolchain choices are exclusive and affect generated lint configuration.
