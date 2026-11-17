import { useCallback, useEffect, useRef, useState } from 'react'
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

function getSession() {
  const { isValid, token, record } = pb.authStore
  return isValid && record ? { token, user: record } : null
}

function hasStatus(err: unknown, statuses: Array<number>) {
  return err instanceof ClientResponseError && statuses.includes(err.status)
}

// PocketBase v0.42+ answers any request that carries an expired or
// invalidated token with 401 (e.g. after a password change elsewhere). The
// client in lib/pocketbase.ts then signs out if that token is still current.
function isSessionError(err: unknown) {
  return hasStatus(err, [401])
}

function getErrorMessage(err: unknown) {
  if (err instanceof ClientResponseError) {
    if (err.status === 0) return `Could not connect to ${POCKETBASE_URL}.`
    // Validation errors carry the useful message per field.
    const fieldError = Object.values<{ message?: string }>(
      err.response.data ?? {},
    ).at(0)
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
  const [session, setSession] = useState(getSession)
  const [serverError, setServerError] = useState<string | null>(null)
  // Wait for the health check and session refresh before rendering anything
  // that talks to PocketBase, so a stale saved session never starts requests.
  const [ready, setReady] = useState(false)

  useEffect(() => pb.authStore.onChange(() => setSession(getSession())), [])

  const checkServer = useCallback(async () => {
    try {
      await pb.health.check()
    } catch (err) {
      // A 401 means the server is up but rejected the saved token.
      if (!isSessionError(err)) {
        setServerError(getErrorMessage(err))
        return
      }
    }
    if (pb.authStore.isValid) {
      const token = pb.authStore.token
      try {
        await users.authRefresh()
      } catch (err) {
        if (!hasStatus(err, [401, 403, 404])) {
          setServerError(getErrorMessage(err))
          return
        }
        // The saved session is stale, e.g. after resetting pb_data.
        if (pb.authStore.token === token) pb.authStore.clear()
      }
    }
    setServerError(null)
    setReady(true)
  }, [])

  useEffect(() => {
    void checkServer()
  }, [checkServer])

  return (
    <main className="demo-page">
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <section className="demo-panel">
          <div className="text-center">
            <h1 className="demo-title">PocketBase todos</h1>
            <p className="demo-muted mt-2">
              Private, realtime todos from {POCKETBASE_URL}
            </p>
          </div>
        </section>

        {serverError ? (
          <SetupSteps error={serverError} onRetry={checkServer} />
        ) : !ready ? (
          <section className="demo-card p-8 text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-[var(--lagoon-deep)]"></div>
            <p className="demo-muted">Connecting to PocketBase...</p>
          </section>
        ) : session ? (
          // Remount per session: one user's todos never render for the next,
          // and a new token (e.g. from another tab) reloads the list.
          <TodoList
            key={session.token}
            userId={session.user.id}
            email={session.user.email}
            onLoadError={setServerError}
          />
        ) : (
          <AuthForm />
        )}
      </div>
    </main>
  )
}

function SetupSteps({
  error,
  onRetry,
}: {
  error: string
  onRetry: () => Promise<void>
}) {
  const [retrying, setRetrying] = useState(false)

  const handleRetry = () => {
    setRetrying(true)
    void onRetry().finally(() => setRetrying(false))
  }

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
      <button
        type="button"
        onClick={handleRetry}
        disabled={retrying}
        className="demo-button justify-self-start"
      >
        {retrying ? 'Checking...' : 'Try again'}
      </button>
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
  const [adding, setAdding] = useState(false)
  const [pendingIds, setPendingIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  )
  const signalRef = useRef<AbortSignal | null>(null)

  useEffect(() => {
    // Every request below uses this signal. Aborting it on unmount (sign out
    // or a user switch) means a late 401 for this session can't clear the next.
    const controller = new AbortController()
    const { signal } = controller
    signalRef.current = signal

    // The collection's listRule scopes both the list and the realtime events
    // to the signed-in user.
    const subscription = todos
      .getFullList({ sort: 'created', signal })
      .then((records) => {
        if (signal.aborted) return undefined
        setItems(records)
        return todos.subscribe('*', ({ action, record }) => {
          setItems((current) => {
            if (!current) return current
            if (action === 'delete') {
              return current.filter((item) => item.id !== record.id)
            }
            return upsert(current, record)
          })
        })
      })
      .catch((err: unknown) => {
        if (!signal.aborted && !isSessionError(err)) {
          onLoadError(getErrorMessage(err))
        }
        return undefined
      })

    return () => {
      controller.abort()
      // Unsubscribe once the subscription exists, even if it is still pending.
      void subscription.then((unsubscribe) => unsubscribe?.())
    }
  }, [onLoadError])

  const run = (action: () => Promise<void>) => {
    setActionError(null)
    action().catch((err: unknown) => {
      if (!isSessionError(err)) setActionError(getErrorMessage(err))
    })
  }

  const handleAddTodo = (e: FormEvent) => {
    e.preventDefault()
    const text = newTodo.trim()
    if (!text || adding) return
    setAdding(true)
    run(async () => {
      try {
        const record = await todos.create(
          { text, completed: false, owner: userId },
          { signal: signalRef.current },
        )
        setItems((current) => (current ? upsert(current, record) : [record]))
        setNewTodo('')
      } finally {
        setAdding(false)
      }
    })
  }

  // Lock a todo's buttons while its request runs, so a double click can't
  // toggle it twice or delete it twice.
  const runForTodo = (id: string, action: () => Promise<void>) => {
    if (pendingIds.has(id)) return
    setPendingIds((current) => new Set(current).add(id))
    run(async () => {
      try {
        await action()
      } finally {
        setPendingIds((current) => {
          const next = new Set(current)
          next.delete(id)
          return next
        })
      }
    })
  }

  const handleToggleTodo = (todo: Todo) => {
    runForTodo(todo.id, async () => {
      const record = await todos.update(
        todo.id,
        { completed: !todo.completed },
        { signal: signalRef.current },
      )
      setItems((current) => (current ? upsert(current, record) : current))
    })
  }

  const handleRemoveTodo = (id: string) => {
    runForTodo(id, async () => {
      await todos.delete(id, { signal: signalRef.current })
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
        <form onSubmit={handleAddTodo} className="flex gap-3">
          <input
            type="text"
            value={newTodo}
            onChange={(e) => {
              setNewTodo(e.target.value)
              setActionError(null)
            }}
            placeholder="What needs to be done?"
            aria-label="New todo"
            maxLength={500}
            className="demo-input min-w-0 flex-1"
          />
          <button
            type="submit"
            disabled={adding || !newTodo.trim()}
            className="demo-button"
          >
            <Plus size={20} />
            {adding ? 'Adding...' : 'Add'}
          </button>
        </form>
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
                  disabled={pendingIds.has(todo.id)}
                  aria-label={
                    todo.completed ? 'Mark as not done' : 'Mark as done'
                  }
                  className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 disabled:opacity-50 ${
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
                  disabled={pendingIds.has(todo.id)}
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
