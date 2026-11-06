## Setting up PocketBase

This project uses [PocketBase](https://pocketbase.io), an open source backend in a single file: an embedded SQLite database, auth, realtime subscriptions, file storage and an admin dashboard.

1. [Download PocketBase](https://pocketbase.io/docs/) for your platform and place the `pocketbase` binary in the root of this project.
2. Start the server:

   ```bash
   ./pocketbase serve
   ```

   On first start, PocketBase applies the migration in `pb_migrations/`, which creates the `todos` collection used by the demo.

3. Open the admin dashboard at http://127.0.0.1:8090/_/ and create your superuser account.
4. Make sure `VITE_POCKETBASE_URL` in `.env.local` points to your PocketBase server (defaults to `http://127.0.0.1:8090`).
5. Run the app, visit `/demo/pocketbase` and create an account.

### What the add-on includes

- `src/lib/pocketbase.ts`: PocketBase JS SDK client (`pb`) and a `createPocketBase()` factory for per-request clients in server functions.
- `src/routes/demo/pocketbase.tsx`: email and password sign-in, plus a private todo list with realtime updates.
- `pb_migrations/`: JS migrations applied automatically by `pocketbase serve`.
- `.gitignore` entries for the `pocketbase` binary and `pb_data/`, which holds your local database and uploaded files.

### Permissions

Each todo has an `owner` relation to the built-in `users` collection, and the collection's API rules enforce ownership on the server:

| Action             | Rule                                                                                                  |
| ------------------ | ----------------------------------------------------------------------------------------------------- |
| List, view, delete | `@request.auth.id != "" && owner = @request.auth.id`                                                  |
| Create             | `@request.auth.id != "" && @request.body.owner = @request.auth.id`                                    |
| Update             | The list rule, plus `(@request.body.owner:isset = false \|\| @request.body.owner = @request.auth.id)` |

Realtime subscriptions follow the list rule, so users only receive events for their own todos. Deleting a user also deletes their todos.

> [!IMPORTANT]
> PocketBase's default `users` collection allows public sign-ups. Review its API rules and enable email verification before deploying.

Learn more in the [PocketBase docs](https://pocketbase.io/docs/) and the [JS SDK docs](https://github.com/pocketbase/js-sdk).
