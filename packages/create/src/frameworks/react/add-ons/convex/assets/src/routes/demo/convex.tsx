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
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background:
          'linear-gradient(135deg, #667a56 0%, #8fbc8f 25%, #90ee90 50%, #98fb98 75%, #f0fff0 100%)',
      }}
    >
      <div className="w-full max-w-2xl">
        {/* Header Card */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-green-200/50 p-8 mb-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-green-800 mb-2">
              Convex Todos
            </h1>
            <p className="text-green-600 text-lg">Powered by real-time sync</p>
            {totalCount > 0 && (
              <div className="mt-4 flex justify-center space-x-6 text-sm">
                <span className="text-green-700 font-medium">
                  {completedCount} completed
                </span>
                <span className="text-gray-600">
                  {totalCount - completedCount} remaining
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Add Todo Card */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-green-200/50 p-6 mb-6">
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
              className="flex-1 px-4 py-3 rounded-xl border-2 border-green-200 focus:border-green-400 focus:outline-none text-gray-800 placeholder-gray-500 bg-white/80 transition-colors"
            />
            <button
              onClick={handleAddTodo}
              disabled={!newTodo.trim()}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl"
            >
              <Plus size={20} />
              Add
            </button>
          </div>
        </div>

        {/* Todos List */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-green-200/50 overflow-hidden">
          {!todos ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-4"></div>
              <p className="text-green-600">Loading todos...</p>
            </div>
          ) : todos.length === 0 ? (
            <div className="p-12 text-center">
              <Circle size={48} className="text-green-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-green-800 mb-2">
                No todos yet
              </h3>
              <p className="text-green-600">
                Add your first todo above to get started!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-green-100">
              {todos.map((todo, index) => (
                <div
                  key={todo._id}
                  className={`p-4 flex items-center gap-4 hover:bg-green-50/50 transition-colors ${
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
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'border-green-300 hover:border-green-400 text-transparent hover:text-green-400'
                    }`}
                  >
                    <Check size={14} />
                  </button>

                  <span
                    className={`flex-1 text-lg transition-all duration-200 ${
                      todo.completed
                        ? 'line-through text-gray-500'
                        : 'text-gray-800'
                    }`}
                  >
                    {todo.text}
                  </span>

                  <button
                    onClick={() => handleRemoveTodo(todo._id)}
                    className="flex-shrink-0 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-green-700/80 text-sm">
            Built with Convex • Real-time updates • Always in sync
          </p>
        </div>
      </div>
    </div>
  )
}
