import { useState } from 'react'

import { useChat, useMessages } from '#/hooks/demo.useChat'

import Messages from './demo.messages'

export default function ChatArea() {
  const { sendMessage } = useChat()

  const messages = useMessages()

  const [message, setMessage] = useState('')
  const [user, setUser] = useState('Alice')

  const postMessage = () => {
    if (message.trim().length) {
      sendMessage(message, user)
      setMessage('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      postMessage()
    }
  }

  return (
    <>
      <div className="flex-1 space-y-4 overflow-auto px-4 py-6">
        <Messages messages={messages} user={user} />
      </div>

      <div className="border-t border-[var(--line)] bg-[var(--chip-bg)] px-4 py-4">
        <div className="flex items-center space-x-3">
          <select
            value={user}
            onChange={(e) => setUser(e.target.value)}
            className="demo-select demo-input-fit text-sm"
          >
            <option value="Alice">Alice</option>
            <option value="Bob">Bob</option>
          </select>

          <div className="flex-1 relative">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type a message..."
              className="demo-input"
            />
          </div>

          <button
            onClick={postMessage}
            disabled={message.trim() === ''}
            className="demo-button"
          >
            Send
          </button>
        </div>
      </div>
    </>
  )
}
