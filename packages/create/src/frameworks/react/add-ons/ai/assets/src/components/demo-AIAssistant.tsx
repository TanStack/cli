import { useEffect, useRef, useState } from 'react'
import { useStore } from '@tanstack/react-store'
import { Store } from '@tanstack/store'

import { Send, X, ChevronRight, BotIcon } from 'lucide-react'
import { Streamdown } from 'streamdown'

import { useGuitarRecommendationChat } from '#/lib/demo-ai-hook'
import type { ChatMessages } from '#/lib/demo-ai-hook'

import GuitarRecommendation from './demo-GuitarRecommendation'

export const showAIAssistant = new Store(false)

function Messages({ messages }: { messages: ChatMessages }) {
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight
    }
  }, [messages])

  if (!messages.length) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
        Ask me anything! I'm here to help.
      </div>
    )
  }

  return (
    <div ref={messagesContainerRef} className="flex-1 overflow-y-auto">
      {messages.map(({ id, role, parts }) => (
        <div
          key={id}
          className={`py-3 ${
            role === 'assistant'
              ? 'bg-linear-to-r from-orange-500/5 to-red-600/5'
              : 'bg-transparent'
          }`}
        >
          {parts.map((part, index) => {
            if (part.type === 'text' && part.content) {
              return (
                <div key={index} className="flex items-start gap-2 px-4">
                  {role === 'assistant' ? (
                    <div className="w-6 h-6 rounded-lg bg-linear-to-r from-orange-500 to-red-600 flex items-center justify-center text-xs font-medium text-white flex-shrink-0">
                      AI
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-lg bg-gray-700 flex items-center justify-center text-xs font-medium text-white flex-shrink-0">
                      Y
                    </div>
                  )}
                  <div className="flex-1 min-w-0 text-white prose dark:prose-invert max-w-none prose-sm">
                    <Streamdown>{part.content}</Streamdown>
                  </div>
                </div>
              )
            }
            if (
              part.type === 'tool-call' &&
              part.name === 'recommendGuitar' &&
              part.output
            ) {
              return (
                <div key={part.id} className="max-w-[80%] mx-auto">
                  <GuitarRecommendation id={String(part.output?.id)} />
                </div>
              )
            }
          })}
        </div>
      ))}
    </div>
  )
}

export default function AIAssistant() {
  const isOpen = useStore(showAIAssistant)
  const { messages, sendMessage } = useGuitarRecommendationChat()
  const [input, setInput] = useState('')

  return (
    <div className="relative z-50">
      <button
        onClick={() => showAIAssistant.setState((state) => !state)}
        className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg bg-linear-to-r from-green-700 to-green-900 text-white hover:opacity-90 transition-opacity"
      >
        <div className="flex items-center gap-2">
          <BotIcon size={24} />
          <span className="font-medium">AI Assistant</span>
        </div>
        <ChevronRight className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute bottom-0 left-full ml-2 w-[700px] h-[600px] bg-gray-900 rounded-lg shadow-xl border border-orange-500/20 flex flex-col">
          <div className="flex items-center justify-between p-3 border-b border-orange-500/20">
            <h3 className="font-semibold text-white">AI Assistant</h3>
            <button
              onClick={() => showAIAssistant.setState((state) => !state)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <Messages messages={messages} />

          <div className="p-3 border-t border-orange-500/20">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (input.trim()) {
                  sendMessage(input)
                  setInput('')
                }
              }}
            >
              <div className="relative">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message..."
                  className="w-full rounded-lg border border-orange-500/20 bg-gray-800/50 pl-3 pr-10 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-transparent resize-none overflow-hidden"
                  rows={1}
                  style={{ minHeight: '36px', maxHeight: '120px' }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement
                    target.style.height = 'auto'
                    target.style.height =
                      Math.min(target.scrollHeight, 120) + 'px'
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && input.trim()) {
                      e.preventDefault()
                      sendMessage(input)
                      setInput('')
                    }
                  }}
                />
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-orange-500 hover:text-orange-400 disabled:text-gray-500 transition-colors focus:outline-none"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
