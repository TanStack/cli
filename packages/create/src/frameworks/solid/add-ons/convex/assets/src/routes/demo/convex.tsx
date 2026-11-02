import { createFileRoute } from '@tanstack/solid-router'
import { Trash2, Plus, Check, Circle } from 'lucide-solid'

import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { createSignal, For, Show } from 'solid-js'
import { useMutation, useQuery } from 'convex-solidjs'

export const Route = createFileRoute('/demo/convex')({
  ssr: false,
  component: ConvexTodos,
})

function ConvexTodos() {
  const todos = useQuery(api.todos.list, () => ({}))
  const addTodo = useMutation(api.todos.add)
  const toggleTodo = useMutation(api.todos.toggle)
  const removeTodo = useMutation(api.todos.remove)

  const [newTodo, setNewTodo] = createSignal('')

  const handleAddTodo = async () => {
    if (newTodo().trim()) {
      await addTodo.mutate({ text: newTodo().trim() })
      setNewTodo('')
    }
  }

  const handleToggleTodo = async (id: Id<'todos'>) => {
    await toggleTodo.mutate({ id })
  }
  const handleRemoveTodo = async (id: Id<'todos'>) => {
    await removeTodo.mutate({ id })
  }

  const completedCount = () =>
    todos?.data()?.filter((todo) => todo.completed).length || 0
  const totalCount = () => todos?.data()?.length || 0

  return (
    <main class="demo-page">
      <div class="mx-auto w-full max-w-2xl space-y-6">
        <section class="demo-panel">
          <div class="text-center">
            <p class="island-kicker mb-2">Convex</p>
            <h1 class="demo-title">Todos</h1>
            <p class="demo-muted mt-2">Powered by real-time sync</p>
            <Show when={totalCount() > 0}>
              <div class="mt-4 flex justify-center space-x-6 text-sm">
                <span class="font-medium">{completedCount()} completed</span>
                <span class="demo-muted">
                  {totalCount() - completedCount()} remaining
                </span>
              </div>
            </Show>
          </div>
        </section>

        <section class="demo-card">
          <div class="flex gap-3">
            <input
              type="text"
              value={newTodo()}
              onInput={(e) => setNewTodo(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddTodo()
                }
              }}
              placeholder="What needs to be done?"
              class="demo-input min-w-0 flex-1"
            />
            <button
              onClick={handleAddTodo}
              disabled={!newTodo().trim()}
              class="demo-button"
            >
              <Plus size={20} />
              Add
            </button>
          </div>
        </section>

        <section class="demo-card overflow-hidden p-0">
          <Show when={todos.isLoading()}>
            <div class="p-8 text-center">
              <div class="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-[var(--lagoon-deep)]"></div>
              <p class="demo-muted">Loading todos...</p>
            </div>
          </Show>
          <Show
            when={todos.data()?.length !== 0}
            fallback={
              <div class="p-12 text-center">
                <Circle size={48} class="demo-muted mx-auto mb-4" />
                <h3 class="demo-section-title mb-2">No todos yet</h3>
                <p class="demo-muted">
                  Add your first todo above to get started!
                </p>
              </div>
            }
          >
            <div class="divide-y divide-[var(--line)]">
              <For each={todos.data()}>
                {(todo, index) => (
                  <div
                    class={`p-4 flex items-center gap-4 transition-colors hover:bg-[var(--link-bg-hover)] ${
                      todo.completed ? 'opacity-75' : ''
                    }`}
                    style={{
                      'animation-delay': `${index() * 50}ms`,
                    }}
                  >
                    <button
                      onClick={() => handleToggleTodo(todo._id)}
                      class={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                        todo.completed
                          ? 'border-[var(--lagoon-deep)] bg-[var(--lagoon)] text-[var(--sea-ink)]'
                          : 'border-[var(--line)] text-transparent hover:border-[var(--lagoon-deep)] hover:text-[var(--lagoon-deep)]'
                      }`}
                    >
                      <Check size={14} />
                    </button>

                    <span
                      class={`flex-1 text-lg transition-all duration-200 ${
                        todo.completed
                          ? 'line-through demo-muted'
                          : 'text-[var(--sea-ink)]'
                      }`}
                    >
                      {todo.text}
                    </span>

                    <button
                      onClick={() => handleRemoveTodo(todo._id)}
                      class="demo-button demo-button-danger flex-shrink-0 p-2"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                )}
              </For>
            </div>
          </Show>
        </section>

        <div class="text-center mt-6">
          <p class="demo-muted text-sm">
            Built with Convex, real-time updates, and synced state.
          </p>
        </div>
      </div>
    </main>
  )
}
