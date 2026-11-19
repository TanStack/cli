# Intlayer i18n

This add-on sets up [Intlayer](https://intlayer.org/doc/environment/tanstack-start) with localized routes.

- Locales and routing are configured in `intlayer.config.ts` (`prefix-no-default`: `/demo/intlayer`, `/fr/demo/intlayer`).
- Routes under `src/routes/{-$locale}/` are localized. Its `route.tsx` validates the locale prefix and provides `IntlayerProvider`.
- Use `LocalizedLink` and `useLocalizedNavigate` to keep the current locale when navigating.
- Content is declared in `*.content.ts` files, outside `src/routes`. The `vite-intlayer` plugin builds them into `.intlayer`.
- To localize the whole app, move your routes under `src/routes/{-$locale}/`, or run `npx intlayer init`.
