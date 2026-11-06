import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Check, Circle, LogOut, Plus, Trash2 } from 'lucide-react'
import { ClientResponseError } from 'pocketbase'
import type { RecordModel } from 'pocketbase'

import { POCKETBASE_URL, pb } from '../../lib/pocketbase'

export const Route = createFileRoute('/demo/pocketbase')({
  ssr: false,
  component: PocketBaseDemo,
})

interface Todo extends RecordModel {
  text: string
  completed: boolean
  owner: string
}

const todos = pb.collection<Todo>('todos')
const users = pb.collection('users')

function getCurrentUser() {
  return pb.authStore.isValid ? pb.authStore.record : null
}

function getErrorMessage(err: unknown) {
  if (err instanceof ClientResponseError) {
    if (err.status === 0) return `Could not connect to ${POCKETBASE_URL}.`
    // Validation errors carry the useful message per field.
    const [fieldError] = Object.values(err.response.data ?? {}) as Array<{
      message?: string
    }>
    return fieldError?.message ?? err.message
  }
  return err instanceof Error ? err.message : String(err)
}

function upsert(list: Array<Todo>, todo: Todo) {
  const exists = list.some((item) => item.id === todo.id)
  return exists
    ? list.map((item) => (item.id === todo.id ? todo : item))
    : [...list, todo]
}

function PocketBaseDemo() {
  const [user, setUser] = useState(getCurrentUser)
  const [serverError, setServerError] = useState<string | null>(null)

  useEffect(() => pb.authStore.onChange(() => setUser(getCurrentUser())), [])

  useEffect(() => {
    let cancelled = false

    pb.health
      .check()
      .then(async () => {
        if (pb.authStore.isValid) await users.authRefresh()
      })
      .catch((err: unknown) => {
        if (cancelled) return
        if (
          err instanceof ClientResponseError &&
          [401, 403, 404].includes(err.status)
        ) {
          // The stored session is stale, e.g. after resetting pb_data.
          pb.authStore.clear()
        } else {
          setServerError(getErrorMessage(err))
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <main className="demo-page">
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <section className="demo-panel">
          <div className="text-center">
            <p className="island-kicker mb-2">PocketBase</p>
            <h1 className="demo-title">Todos</h1>
            <p className="demo-muted mt-2">
              Private, realtime todos from {POCKETBASE_URL}
            </p>
          </div>
        </section>

        {serverError ? (
          <SetupSteps error={serverError} />
        ) : user ? (
          // Remount per user so one user's todos never render for the next.
          <TodoList
            key={user.id}
            userId={user.id}
            email={user.email}
            onLoadError={setServerError}
          />
        ) : (
          <AuthForm />
        )}

        <div className="text-center mt-6">
          <p className="demo-muted text-sm">
            Built with PocketBase: SQLite, auth, realtime and an admin UI in a
            single binary.
          </p>
        </div>
      </div>
    </main>
  )
}

function SetupSteps({ error }: { error: string }) {
  return (
    <section className="demo-card grid gap-3">
      <h2 className="demo-section-title">PocketBase is not ready</h2>
      <p className="demo-muted text-sm">{error}</p>
      <ol className="demo-muted list-decimal space-y-1 pl-5 text-sm">
        <li>
          Download PocketBase from{' '}
          <a
            href="https://pocketbase.io/docs/"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            pocketbase.io/docs
          </a>{' '}
          and place the binary in the project root.
        </li>
        <li>
          Run <code>./pocketbase serve</code> (this applies the migration in{' '}
          <code>pb_migrations/</code> and creates the <code>todos</code>{' '}
          collection).
        </li>
        <li>
          Make sure <code>VITE_POCKETBASE_URL</code> in <code>.env.local</code>{' '}
          points to your server.
        </li>
      </ol>
    </section>
  )
}

function AuthForm() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (isSignUp) {
        await users.create({ email, password, passwordConfirm: password })
      }
      await users.authWithPassword(email, password)
    } catch (err) {
      setError(getErrorMessage(err))
      setLoading(false)
    }
  }

  return (
    <section className="demo-card">
      <h2 className="demo-section-title">
        {isSignUp ? 'Create an account' : 'Sign in to see your todos'}
      </h2>

      <form onSubmit={(e) => void handleSubmit(e)} className="mt-4 grid gap-4">
        <div className="grid gap-2">
          <label
            htmlFor="pocketbase-email"
            className="text-sm font-medium leading-none"
          >
            Email
          </label>
          <input
            id="pocketbase-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className="demo-input"
            required
          />
        </div>

        <div className="grid gap-2">
          <label
            htmlFor="pocketbase-password"
            className="text-sm font-medium leading-none"
          >
            Password
          </label>
          <input
            id="pocketbase-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
            className="demo-input"
            required
            minLength={8}
          />
        </div>

        {error && (
          <div className="demo-alert demo-alert-danger">
            <p className="text-sm">{error}</p>
          </div>
        )}

        <button type="submit" disabled={loading} className="demo-button w-full">
          {loading ? 'Please wait' : isSignUp ? 'Create account' : 'Sign in'}
        </button>
      </form>

      <div className="mt-4 text-center">
        <button
          type="button"
          onClick={() => {
            setIsSignUp(!isSignUp)
            setError(null)
          }}
          className="demo-muted text-sm transition-colors hover:text-[var(--sea-ink)]"
        >
          {isSignUp
            ? 'Already have an account? Sign in'
            : "Don't have an account? Create one"}
        </button>
      </div>
    </section>
  )
}

function TodoList({
  userId,
  email,
  onLoadError,
}: {
  userId: string
  email: string
  onLoadError: (message: string) => void
}) {
  const [items, setItems] = useState<Array<Todo> | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [newTodo, setNewTodo] = useState('')

  useEffect(() => {
    let unsubscribe: (() => Promise<void>) | undefined
    let cancelled = false

    // The collection's listRule scopes both the list and the realtime events
    // to the signed-in user.
    todos
      .getFullList({ sort: 'created' })
      .then(async (records) => {
        if (cancelled) return
        setItems(records)
        unsubscribe = await todos.subscribe('*', ({ action, record }) => {
          setItems((current) => {
            if (!current) return current
            if (action === 'delete') {
              return current.filter((item) => item.id !== record.id)
            }
            return upsert(current, record)
          })
        })
        if (cancelled) await unsubscribe()
      })
      .catch((err: unknown) => {
        if (!cancelled) onLoadError(getErrorMessage(err))
      })

    return () => {
      cancelled = true
      void unsubscribe?.()
    }
  }, [onLoadError])

  const run = (action: () => Promise<void>) => {
    setActionError(null)
    action().catch((err: unknown) => setActionError(getErrorMessage(err)))
  }

  const handleAddTodo = () => {
    const text = newTodo.trim()
    if (!text) return
    run(async () => {
      const record = await todos.create({
        text,
        completed: false,
        owner: userId,
      })
      setItems((current) => (current ? upsert(current, record) : [record]))
      setNewTodo('')
    })
  }

  const handleToggleTodo = (todo: Todo) => {
    run(async () => {
      const record = await todos.update(todo.id, {
        completed: !todo.completed,
      })
      setItems((current) => (current ? upsert(current, record) : current))
    })
  }

  const handleRemoveTodo = (id: string) => {
    run(async () => {
      await todos.delete(id)
      setItems((current) =>
        current ? current.filter((item) => item.id !== id) : current,
      )
    })
  }

  const completedCount = items?.filter((todo) => todo.completed).length || 0
  const totalCount = items?.length || 0

  return (
    <>
      <section className="demo-card flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 text-sm">
          <p className="demo-muted">Signed in as</p>
          <p className="truncate font-medium">{email}</p>
          {totalCount > 0 && (
            <p className="demo-muted mt-1">
              {completedCount} completed, {totalCount - completedCount}{' '}
              remaining
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => pb.authStore.clear()}
          className="demo-button demo-button-secondary"
        >
          <LogOut size={18} />
          Sign out
        </button>
      </section>

      <section className="demo-card">
        <div className="flex gap-3">
          <input
            type="text"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddTodo()
            }}
            placeholder="What needs to be done?"
            aria-label="New todo"
            className="demo-input min-w-0 flex-1"
          />
          <button
            type="button"
            onClick={handleAddTodo}
            disabled={!newTodo.trim()}
            className="demo-button"
          >
            <Plus size={20} />
            Add
          </button>
        </div>
        {actionError && (
          <div className="demo-alert demo-alert-danger mt-3">
            <p className="text-sm">{actionError}</p>
          </div>
        )}
      </section>

      <section className="demo-card overflow-hidden p-0">
        {!items ? (
          <div className="p-8 text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-[var(--lagoon-deep)]"></div>
            <p className="demo-muted">Loading todos...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center">
            <Circle size={48} className="demo-muted mx-auto mb-4" />
            <h3 className="demo-section-title">No todos yet</h3>
            <p className="demo-muted mt-2">
              Add your first todo above, then open this page in another tab to
              see realtime sync.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--line)]">
            {items.map((todo) => (
              <div
                key={todo.id}
                className={`p-4 flex items-center gap-4 transition-colors hover:bg-[var(--link-bg-hover)] ${
                  todo.completed ? 'opacity-75' : ''
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleToggleTodo(todo)}
                  aria-label={
                    todo.completed ? 'Mark as not done' : 'Mark as done'
                  }
                  className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                    todo.completed
                      ? 'border-[var(--lagoon-deep)] bg-[var(--lagoon)] text-[var(--sea-ink)]'
                      : 'border-[var(--line)] text-transparent hover:border-[var(--lagoon-deep)] hover:text-[var(--lagoon-deep)]'
                  }`}
                >
                  <Check size={14} />
                </button>

                <span
                  className={`flex-1 text-lg transition-all duration-200 ${
                    todo.completed
                      ? 'line-through demo-muted'
                      : 'text-[var(--sea-ink)]'
                  }`}
                >
                  {todo.text}
                </span>

                <button
                  type="button"
                  onClick={() => handleRemoveTodo(todo.id)}
                  aria-label="Delete todo"
                  className="demo-button demo-button-danger flex-shrink-0 p-2"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  )
}
