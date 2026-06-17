import { createServerFn } from '@tanstack/react-start'
import { createFileRoute, useRouter } from '@tanstack/react-router'

import { getClient } from '#/db'

const getTodos = createServerFn({
  method: 'GET',
}).handler(async () => {
  const client = await getClient()
  if (!client) {
    return undefined
  }
  return (await client.query(`SELECT * FROM todos`)) as Array<{
    id: number
    title: string
  }>
})

const insertTodo = createServerFn({
  method: 'POST',
})
  .inputValidator((d: { title: string }) => d)
  .handler(async ({ data }) => {
    const client = await getClient()
    if (!client) {
      return undefined
    }
    await client.query(`INSERT INTO todos (title) VALUES ($1)`, [data.title])
  })

export const Route = createFileRoute('/demo/neon')({
  component: App,
  loader: async () => {
    const todos = await getTodos()
    return { todos }
  },
})

function App() {
  const { todos } = Route.useLoaderData()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)
    const data = Object.fromEntries(formData)
    await insertTodo({ data: { title: data.title as string } })
    router.invalidate()
  }

  if (!todos) {
    return (
      <main className="demo-page demo-center">
        <section className="demo-panel w-full max-w-2xl">
          <DBConnectionError />
        </section>
      </main>
    )
  }

  return (
    <main className="demo-page demo-center">
      <section className="demo-panel w-full max-w-2xl">
        <header className="mb-8 flex items-center gap-4">
          <span className="demo-card flex h-14 w-14 items-center justify-center p-3">
            <img src="/demo-neon.svg" alt="Neon Logo" className="h-8 w-8" />
          </span>
          <div>
            <p className="island-kicker mb-2">Database</p>
            <h1 className="demo-title">Neon Demo</h1>
          </div>
        </header>
        {todos && (
          <>
            <h2 className="demo-section-title mb-4">Todos</h2>
            <ul className="space-y-3 mb-6">
              {todos.map((todo: { id: number; title: string }) => (
                <li key={todo.id} className="demo-list-item">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{todo.title}</span>
                    <span className="demo-muted text-xs">#{todo.id}</span>
                  </div>
                </li>
              ))}
            </ul>
            <form
              onSubmit={handleSubmit}
              className="mt-4 flex flex-col gap-2 sm:flex-row"
            >
              <input
                type="text"
                name="title"
                className="demo-input min-w-0 flex-1"
              />
              <button type="submit" className="demo-button whitespace-nowrap">
                Add Todo
              </button>
            </form>
          </>
        )}
      </section>
    </main>
  )
}

function DBConnectionError() {
  return (
    <div className="text-center space-y-6">
      <div className="flex items-center justify-center mb-4">
        <svg
          className="w-12 h-12 text-amber-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h2 className="text-2xl font-bold mb-4">Database Connection Issue</h2>
      <div className="demo-muted text-lg mb-6">
        The Neon database is not connected.
      </div>
      <div className="demo-card max-w-xl mx-auto text-left">
        <h3 className="text-lg font-semibold mb-4">Required Steps to Fix:</h3>
        <ul className="space-y-4 text-left list-none">
          <li className="flex items-start">
            <span className="demo-pill mr-3 min-w-8 justify-center">1</span>
            <div>
              Use the <code>db/init.sql</code> file to create the database
            </div>
          </li>
          <li className="flex items-start">
            <span className="demo-pill mr-3 min-w-8 justify-center">2</span>
            <div>
              Set the <code>DATABASE_URL</code> environment variable to the
              connection string of your Neon database
            </div>
          </li>
        </ul>
      </div>
    </div>
  )
}
