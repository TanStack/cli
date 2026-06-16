import type { Message } from '#/db-collections'

export const getAvatarColor = (username: string) => {
  const colors = [
    'bg-[var(--lagoon-deep)]',
    'bg-[var(--palm)]',
    'bg-[var(--sea-ink-soft)]',
    'bg-[var(--lagoon)]',
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
                  ? 'bg-[var(--lagoon-deep)] text-white rounded-br-md'
                  : 'border border-[var(--line)] bg-[var(--chip-bg)] text-[var(--sea-ink)] rounded-bl-md'
              }`}
            >
              {msg.user !== user && (
                <p className="demo-muted mb-1 text-xs font-medium">
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
