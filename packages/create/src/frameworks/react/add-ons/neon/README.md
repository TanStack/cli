## Neon setup

Create a database and write its connection string to `.env`:

```sh
npx neon@9.6.3 claim create --env-pull --file .env
```

You can also use an existing Neon database. Set `DATABASE_URL` in `.env` to its connection string.

Run `db/init.sql` once in the Neon SQL Editor to create the demo table and seed its three todos. Repeating the script inserts the sample todos again.

Start the app with your package manager's `dev` command. To keep a claimable database, run `npx neon@9.6.3 claim accept` before it expires.

See https://neon.com/docs/reference/claimable-neon for database setup and claiming.
