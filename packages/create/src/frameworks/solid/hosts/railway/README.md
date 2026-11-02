## Deploy to Railway

Railway's Railpack builder detects the project's package manager and package
scripts automatically.

1. Push this repo to GitHub
2. Visit https://railway.com/new and create a project from your repo
3. In the **Variables** tab, add the entries from `.env.example` with their production values
4. Deploy, then open **Networking** and select **Generate Domain**

Railpack runs the project's build script and starts the generated Nitro server
with `node .output/server/index.mjs`. The server handles SSR, server functions,
API routes, and static assets.

Need a database? Add one from the Railway project canvas, then connect it to the
app with a Railway reference variable. The variable name and value depend on the
database service you choose.
