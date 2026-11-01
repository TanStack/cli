import { useCallback, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation } from 'convex/react'
import { Trash2, Plus, Check, Circle } from 'lucide-react'

import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'

export const Route = createFileRoute('/demo/convex')({
  ssr: false,
  component: ConvexTodos,
})

function ConvexTodos() {
  const todos = useQuery(api.todos.list)
  const addTodo = useMutation(api.todos.add)
  const toggleTodo = useMutation(api.todos.toggle)
  const removeTodo = useMutation(api.todos.remove)

  const [newTodo, setNewTodo] = useState('')

  const handleAddTodo = useCallback(async () => {
    if (newTodo.trim()) {
      await addTodo({ text: newTodo.trim() })
      setNewTodo('')
    }
  }, [addTodo, newTodo])

  const handleToggleTodo = useCallback(
    async (id: Id<'todos'>) => {
      await toggleTodo({ id })
    },
    [toggleTodo],
  )

  const handleRemoveTodo = useCallback(
    async (id: Id<'todos'>) => {
      await removeTodo({ id })
    },
    [removeTodo],
  )

  const completedCount = todos?.filter((todo) => todo.completed).length || 0
  const totalCount = todos?.length || 0

  return (
    <main className="demo-page">
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <section className="demo-panel">
          <div className="text-center">
            <p className="island-kicker mb-2">Convex</p>
            <h1 className="demo-title">Todos</h1>
            <p className="demo-muted mt-2">Powered by real-time sync</p>
            {totalCount > 0 && (
              <div className="mt-4 flex justify-center space-x-6 text-sm">
                <span className="font-medium">{completedCount} completed</span>
                <span className="demo-muted">
                  {totalCount - completedCount} remaining
                </span>
              </div>
            )}
          </div>
        </section>

        <section className="demo-card">
          <div className="flex gap-3">
            <input
              type="text"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddTodo()
                }
              }}
              placeholder="What needs to be done?"
              className="demo-input min-w-0 flex-1"
            />
            <button
              onClick={handleAddTodo}
              disabled={!newTodo.trim()}
              className="demo-button"
            >
              <Plus size={20} />
              Add
            </button>
          </div>
        </section>

        <section className="demo-card overflow-hidden p-0">
          {!todos ? (
            <div className="p-8 text-center">
              <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-[var(--lagoon-deep)]"></div>
              <p className="demo-muted">Loading todos...</p>
            </div>
          ) : todos.length === 0 ? (
            <div className="p-12 text-center">
              <Circle size={48} className="demo-muted mx-auto mb-4" />
              <h3 className="demo-section-title mb-2">No todos yet</h3>
              <p className="demo-muted">
                Add your first todo above to get started!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--line)]">
              {todos.map((todo, index) => (
                <div
                  key={todo._id}
                  className={`p-4 flex items-center gap-4 transition-colors hover:bg-[var(--link-bg-hover)] ${
                    todo.completed ? 'opacity-75' : ''
                  }`}
                  style={{
                    animationDelay: `${index * 50}ms`,
                  }}
                >
                  <button
                    onClick={() => handleToggleTodo(todo._id)}
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
                    onClick={() => handleRemoveTodo(todo._id)}
                    className="demo-button demo-button-danger flex-shrink-0 p-2"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="text-center mt-6">
          <p className="demo-muted text-sm">
            Built with Convex, real-time updates, and synced state.
          </p>
        </div>
      </div>
    </main>
  )
}
