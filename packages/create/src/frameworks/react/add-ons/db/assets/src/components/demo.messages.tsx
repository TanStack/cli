import type { Message } from '#/db-collections'

export const getAvatarColor = (username: string) => {
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-red-500',
    'bg-yellow-500',
    'bg-teal-500',
  ]
  const index = username
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return colors[index % colors.length]
}

export default function Messages({
  messages,
  user,
}: {
  messages: Message[]
  user: string
}) {
  return (
    <>
      {messages.map((msg: Message) => (
        <div
          key={msg.id}
          className={`flex ${
            msg.user === user ? 'justify-end' : 'justify-start'
          }`}
        >
          <div
            className={`flex items-start space-x-3 max-w-xs lg:max-w-md ${
              msg.user === user ? 'flex-row-reverse space-x-reverse' : ''
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${getAvatarColor(
                msg.user,
              )}`}
            >
              {msg.user.charAt(0).toUpperCase()}
            </div>

            <div
              className={`px-4 py-2 rounded-2xl ${
                msg.user === user
                  ? 'bg-blue-500 text-white rounded-br-md'
                  : 'bg-white text-gray-800 border border-gray-200 rounded-bl-md'
              }`}
            >
              {msg.user !== user && (
                <p className="text-xs text-gray-500 mb-1 font-medium">
                  {msg.user}
                </p>
              )}
              <p className="text-sm">{msg.text}</p>
            </div>
          </div>
        </div>
      ))}
    </>
  )
}
