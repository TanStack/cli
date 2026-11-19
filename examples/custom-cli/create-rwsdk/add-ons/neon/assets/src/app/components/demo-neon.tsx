'use client'
import { insertTodo } from '../db'

export default function App({
  todos,
}: {
  todos: Array<{ id: number; title: string }>
}) {
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)
    const data = Object.fromEntries(formData)
    await insertTodo(data.title)
    router.invalidate()
  }

  if (!todos) {
    return <DBConnectionError />
  }

  return (
    <div
      className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-100 to-blue-100 p-4 text-white"
      style={{
        backgroundImage:
          'radial-gradient(circle at 5% 40%, #63F655 0%, #00E0D9 40%, #1a0f0a 100%)',
      }}
    >
      <div className="w-full max-w-2xl p-8 rounded-xl backdrop-blur-md bg-black/50 shadow-xl border-8 border-black/10">
        <div className="flex items-center justify-center gap-4 mb-8 bg-black/30 p-4 rounded-lg">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-1000"></div>
            <div className="relative">
              <img
                src="/demo-neon.svg"
                alt="Neon Logo"
                className="w-12 h-12 transform hover:scale-110 transition-transform duration-200"
              />
            </div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-200 to-cyan-200 text-transparent bg-clip-text">
            Neon Database Demo
          </h1>
        </div>
        {todos && (
          <>
            <h1 className="text-2xl font-bold mb-4">Todos</h1>
            <ul className="space-y-3 mb-6">
              {todos.map((todo: { id: number; title: string }) => (
                <li
                  key={todo.id}
                  className="bg-white/10 backdrop-blur-sm rounded-lg p-4 shadow-sm border border-white/20 transition-all hover:bg-white/20 hover:scale-[1.02] cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-medium group-hover:text-white/90">
                      {todo.title}
                    </span>
                    <span className="text-xs text-white/50">#{todo.id}</span>
                  </div>
                </li>
              ))}
            </ul>
            <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
              <input
                type="text"
                name="title"
                className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#00E0D9] bg-black/20"
              />
              <button
                type="submit"
                className="px-6 py-2 bg-[#00E0D9] text-black font-medium rounded-md hover:bg-[#00E0D9]/80 focus:outline-none focus:ring-2 focus:ring-[#00E0D9] focus:ring-offset-2 transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                Add Todo
              </button>
            </form>
          </>
        )}
      </div>
    </div>
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
      <h2 className="text-2xl font-bold mb-4">Neon database not connected</h2>
      <div className="bg-black/30 p-6 rounded-lg max-w-xl mx-auto">
        <ul className="space-y-4 text-left list-none">
          <li className="flex items-start">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-500 text-black font-bold mr-3 min-w-8 min-h-8">
              1
            </span>
            <div>
              Create a database with{' '}
              <code>npx neon@9.6.3 claim create --env-pull --file .env</code>,
              then seed it once with{' '}
              <code>
                npx neon@9.6.3 psql --role-name neondb_owner -- -f db/init.sql
              </code>
              .
            </div>
          </li>
          <li className="flex items-start">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-500 text-black font-bold mr-3 min-w-8 min-h-8">
              2
            </span>
            <div>
              Copy the CLI's <code>DATABASE_URL</code> value to{' '}
              <code className="bg-black/30 px-2 py-1 rounded">
                VITE_DATABASE_URL
              </code>{' '}
              in <code>.env</code>. After claiming, replace it with a fresh
              connection string from the Neon Console. Restart the dev server
              after changing <code>.env</code>.
            </div>
          </li>
        </ul>
      </div>
    </div>
  )
}
