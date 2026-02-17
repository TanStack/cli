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
      <div className="px-4 py-6 space-y-4">
        <Messages messages={messages} user={user} />
      </div>

      <div className="bg-white border-t border-gray-200 px-4 py-4">
        <div className="flex items-center space-x-3">
          <select
            value={user}
            onChange={(e) => setUser(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <button
            onClick={postMessage}
            disabled={message.trim() === ''}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </>
  )
}
