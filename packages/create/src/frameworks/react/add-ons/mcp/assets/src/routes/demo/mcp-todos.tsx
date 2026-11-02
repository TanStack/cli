import { useCallback, useState, useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'

type Todo = {
  id: number
  title: string
}

export const Route = createFileRoute('/demo/mcp-todos')({
  component: ORPCTodos,
})

function ORPCTodos() {
  const [todos, setTodos] = useState<Todo[]>([])

  useEffect(() => {
    const eventSource = new EventSource('/demo/api/mcp-todos')
    eventSource.onmessage = (event) => {
      setTodos(JSON.parse(event.data))
    }
    return () => eventSource.close()
  }, [])

  const [todo, setTodo] = useState('')

  const submitTodo = useCallback(async () => {
    await fetch('/demo/api/mcp-todos', {
      method: 'POST',
      body: JSON.stringify({ title: todo }),
    })
    setTodo('')
  }, [todo])

  return (
    <main className="demo-page demo-center">
      <section className="demo-panel w-full max-w-2xl">
        <p className="island-kicker mb-2">MCP</p>
        <h1 className="demo-title mb-6">Todos</h1>
        <ul className="mb-4 space-y-2">
          {todos?.map((t) => (
            <li key={t.id} className="demo-list-item">
              <span className="text-base font-medium">{t.title}</span>
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
