import { useCallback, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useTRPC } from '#/integrations/trpc/react'

export const Route = createFileRoute('/demo/trpc-todo')({
  component: TRPCTodos,
  loader: async ({ context }) => {
    await context.queryClient.prefetchQuery(
      context.trpc.todos.list.queryOptions(),
    )
  },
})

function TRPCTodos() {
  const trpc = useTRPC()
  const { data, refetch } = useQuery(trpc.todos.list.queryOptions())

  const [todo, setTodo] = useState('')
  const { mutate: addTodo } = useMutation({
    ...trpc.todos.add.mutationOptions(),
    onSuccess: () => {
      refetch()
      setTodo('')
    },
  })

  const submitTodo = useCallback(() => {
    addTodo({ name: todo })
  }, [addTodo, todo])

  return (
    <main className="demo-page demo-center">
      <section className="demo-panel w-full max-w-2xl">
        <p className="island-kicker mb-2">tRPC</p>
        <h1 className="demo-title mb-6">Todos</h1>
        <ul className="mb-4 space-y-2">
          {data?.map((t) => (
            <li key={t.id} className="demo-list-item">
              <span className="text-base font-medium">{t.name}</span>
            </li>
          ))}
        </ul>
        <div className="flex flex-col gap-2">
          <input
            type="text"
            value={todo}
            onChange={(e) => setTodo(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                submitTodo()
              }
            }}
            placeholder="Enter a new todo..."
            className="demo-input"
          />
          <button
            disabled={todo.trim().length === 0}
            onClick={submitTodo}
            className="demo-button"
          >
            Add todo
          </button>
        </div>
      </section>
    </main>
  )
}
