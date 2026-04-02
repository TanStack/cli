import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { usePowerSync, useQuery, useStatus } from '@powersync/react'

export const Route = createFileRoute('/demo/powersync')({
  component: PowerSyncDemo,
})

type TodoRow = {
  id: string
  created_at: string
  description: string
  completed: number
}

function PowerSyncDemo() {
  const powerSync = usePowerSync()
  const status = useStatus()
  const { data } = useQuery(
    'SELECT id, created_at, description, completed FROM todos ORDER BY created_at DESC',
  )
  const todos = (data ?? []) as Array<TodoRow>
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function addTodo(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextDescription = description.trim()
    if (!nextDescription) {
      return
    }

    try {
      setError(null)
      await powerSync.execute(
        'INSERT INTO todos (id, created_at, description, completed) VALUES (?, ?, ?, ?)',
        [crypto.randomUUID(), new Date().toISOString(), nextDescription, 0],
      )

      setDescription('')
    } catch (error) {
      console.error('Failed to insert PowerSync todo', error)
      setError('Failed to insert row. Please try again.')
    }
  }

  return (
    <main className="page-wrap py-10">
      <div className="max-w-3xl space-y-6">
        <header className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--sea-ink-soft)]">
            Offline Sync
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">PowerSync</h1>
          <p className="text-sm text-[var(--sea-ink-soft)]">
            This demo writes to the local SQLite database immediately. Replace the sample
            schema and backend connector with your real PowerSync configuration.
          </p>
        </header>

        <section className="rounded-3xl border border-[var(--line)] bg-white/70 p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--sea-ink-soft)]">
            Connection State
          </h2>
          <pre className="mt-3 overflow-auto rounded-2xl bg-[var(--chip-bg)] p-4 text-xs leading-6 text-[var(--sea-ink)]">
            {JSON.stringify(status, null, 2)}
          </pre>
        </section>

        <section className="rounded-3xl border border-[var(--line)] bg-white/70 p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--sea-ink-soft)]">
            Local Todos
          </h2>
          {error ? (
            <p className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}
          <form className="mt-4 flex flex-col gap-3 sm:flex-row" onSubmit={addTodo}>
            <label className="sr-only" htmlFor="powersync-todo-description">
              Todo description
            </label>
            <input
              id="powersync-todo-description"
              className="min-w-0 flex-1 rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm text-[var(--sea-ink)] outline-none"
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Write to the local PowerSync database"
              value={description}
            />
            <button
              className="rounded-2xl bg-[var(--sea-ink)] px-4 py-3 text-sm font-semibold text-white"
              type="submit"
            >
              Insert Local Row
            </button>
          </form>

          <ul className="mt-5 space-y-3">
            {todos.length === 0 ? (
              <li className="rounded-2xl border border-dashed border-[var(--line)] px-4 py-5 text-sm text-[var(--sea-ink-soft)]">
                No rows yet. Insert one locally, then wire `uploadData()` to send it upstream.
              </li>
            ) : (
              todos.map((todo) => (
                <li
                  className="rounded-2xl border border-[var(--line)] bg-[var(--chip-bg)] px-4 py-4"
                  key={todo.id}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-[var(--sea-ink)]">{todo.description}</p>
                      <p className="mt-1 text-xs text-[var(--sea-ink-soft)]">
                        {todo.created_at}
                      </p>
                    </div>
                    <span className="rounded-full border border-[var(--line)] px-2 py-1 text-xs font-semibold text-[var(--sea-ink-soft)]">
                      {todo.completed ? 'done' : 'pending'}
                    </span>
                  </div>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>
    </main>
  )
}
