## Inngest

This add-on wires up [Inngest](https://www.inngest.com) for durable workflows, background jobs, and AI agents — a client, a sample event and function, the `serve()` API route, and an interactive demo page.

### Run it locally

Inngest needs two processes: your app and the Inngest Dev Server.

First, uncomment `INNGEST_DEV=1` in `.env.local`. In v4 the SDK defaults to **cloud mode** and requires a signing key — `INNGEST_DEV=1` points it at your local Dev Server instead. **Don't set it in production.**

```bash
# Terminal 1 — your app
npm run dev # or INNGEST_DEV=1 npm run dev

# Terminal 2 — Inngest Dev Server (UI at http://localhost:8288)
npx inngest-cli@latest dev
```

Open [http://localhost:3000/demo/inngest](http://localhost:3000/demo/inngest), click the button to send an event, and watch it run in the [Dev Server UI](http://localhost:8288).

### Where things live

| File                          | What it does                                                            |
| ----------------------------- | ----------------------------------------------------------------------- |
| `src/inngest/client.ts`       | Shared `inngest` client                                                 |
| `src/inngest/functions.ts`    | Events + functions — ships with a `helloWorld` event and `helloWorldFn` |
| `src/routes/api/inngest.ts`   | The `serve()` handler mounted at `/api/inngest` (GET/POST/PUT)          |
| `src/routes/demo/inngest.tsx` | Demo page at `/demo/inngest` that sends the sample event                |
| `.env.local`                  | Commented `INNGEST_DEV=1` and placeholders for production keys          |

### Add your own function

1. Define an event type and function in `src/inngest/functions.ts`:

   ```ts
   export const userSignedUp = eventType('app/user.signed-up', {
     schema: staticSchema<{ userId: string }>(),
   })

   export const userSignedUpFn = inngest.createFunction(
     { id: 'user-signed-up', triggers: [userSignedUp] },
     async ({ event, step }) => {
       await step.run('send-welcome-email', async () => {
         // event.data.userId is typed
       })
     },
   )
   ```

2. Register it in `src/routes/api/inngest.ts`:

   ```ts
   const handler = serve({
     client: inngest,
     functions: [helloWorldFn, userSignedUpFn],
   })
   ```

3. Send the event from anywhere in your app:

   ```ts
   await inngest.send(userSignedUp.create({ userId: '123' }))
   ```

`eventType()` ties the event name to its payload shape, so `event.data` is inferred in both the function handler and `inngest.send()`. Want runtime validation too? Swap `staticSchema` for a Zod schema — see the [trigger helpers reference](https://www.inngest.com/docs/reference/typescript/v4/functions/triggers).

### Deploying to production

1. [Sync your app](https://www.inngest.com/docs/apps/cloud) from the Inngest dashboard, pointing it at `https://your-domain.com/api/inngest`.
2. Set these environment variables in your deployment:
   - `INNGEST_EVENT_KEY` — authorizes `inngest.send()` to deliver events
   - `INNGEST_SIGNING_KEY` — lets the `serve()` handler verify requests from Inngest
3. Make sure `INNGEST_DEV` is **not** set.

> Running on serverless (Vercel, Netlify, etc.)? Set `checkpointing: { maxRuntime: '50s' }` on the client (~80% of your platform's max duration) so checkpointed steps don't get cut off mid-run. [More on checkpointing here](https://www.inngest.com/docs/setup/checkpointing).

See [Inngest's deploy guides](https://www.inngest.com/docs/platform/deployment) for platform specifics.

### Learn more

- [Writing functions](https://www.inngest.com/docs/functions)
- [Steps & flow control](https://www.inngest.com/docs/features/inngest-functions/steps-workflows)
- [Events & triggers](https://www.inngest.com/docs/features/events-triggers)
- [TanStack Start quick start](https://www.inngest.com/docs/getting-started/tanstack-start-quick-start)
