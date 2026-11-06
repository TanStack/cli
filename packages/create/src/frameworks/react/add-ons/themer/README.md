## Themer

`src/integrations/themer/provider.tsx` connects `@lonik/themer` to the root document. Use `useTheme` from `@lonik/themer` to read the current theme or switch between `light`, `dark`, and `system`.

The existing header toggle uses the provider. The storage adapter preserves the scaffold's `theme` preference, including its `auto` value for system mode, and listens for changes from other tabs.
