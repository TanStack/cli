## ArkEnv

Typesafe environment variables for TanStack Start. The add-on installs
`@arkenv/vite-plugin`, writes `src/env.ts`, and can add a `/demo/arkenv`
route that shows server-only keys staying on the server.

Pick a validator when you scaffold: ArkType (`@arkenv/core`), Zod, or
Valibot (`@arkenv/standard`).

### Usage

```ts
import { env } from "#/env";

console.log(env.VITE_API_URL);
```

Docs: [https://arkenv.js.org/docs/frameworks/tanstack-start](https://arkenv.js.org/docs/frameworks/tanstack-start)
