## Neon setup

Create a claimable database and write its connection string to `.env`:

```sh
npx neon@9.6.3 claim create --env-pull --file .env
```

Seed the claimable database from this project directory:

```sh
npx neon@9.6.3 psql --role-name neondb_owner -- -f db/init.sql
```

This creates the demo table and its three sample todos. Run it once, repeating the script inserts the sample todos again.

For an existing Neon database, skip creation, set `DATABASE_URL` in `.env` to its connection string, and run `db/init.sql` once in that project's SQL Editor. The SQL Editor requires an owned project, so use the CLI command above before claiming.

Start the app with your package manager's `dev` command.

To keep a claimable database, run `npx neon@9.6.3 claim accept` before it expires and complete the transfer in the browser. Claiming revokes the temporary database password. Get a fresh connection string from the destination project in the Neon Console, replace `DATABASE_URL` in `.env`, and restart the dev server. `claim accept` does not refresh `.env` for you.

See https://neon.com/docs/reference/claimable-neon for database setup and claiming.
