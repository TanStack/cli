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
      <div className="demo-muted flex flex-1 items-center justify-center text-sm">
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
            role === 'assistant' ? 'bg-[var(--chip-bg)]' : 'bg-transparent'
          }`}
        >
          {parts.map((part, index) => {
            if (part.type === 'text' && part.content) {
              return (
                <div key={index} className="flex items-start gap-2 px-4">
                  {role === 'assistant' ? (
                    <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--lagoon-deep)] text-xs font-medium text-white">
                      AI
                    </div>
                  ) : (
                    <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--sea-ink-soft)] text-xs font-medium text-white">
                      Y
                    </div>
                  )}
                  <div className="min-w-0 flex-1 max-w-none text-sm text-[var(--sea-ink)]">
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
  const isOpen = useStore(showAIAssistant, (state) => state)
  const { messages, sendMessage } = useGuitarRecommendationChat()
  const [input, setInput] = useState('')

  return (
    <div className="relative z-50">
      <button
        onClick={() => showAIAssistant.setState((state) => !state)}
        className="demo-button w-full justify-between px-4 py-2.5"
      >
        <div className="flex items-center gap-2">
          <BotIcon size={24} />
          <span className="font-medium">AI Assistant</span>
        </div>
        <ChevronRight className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="demo-panel fixed inset-x-4 top-20 z-[100] flex h-[calc(100vh-6rem)] max-h-[600px] flex-col overflow-hidden p-0 sm:left-auto sm:w-[min(calc(100vw-2rem),700px)]">
          <div className="flex items-center justify-between border-b border-[var(--line)] p-3">
            <h3 className="font-semibold text-[var(--sea-ink)]">
              AI Assistant
            </h3>
            <button
              onClick={() => showAIAssistant.setState((state) => !state)}
              className="demo-muted transition-colors hover:text-[var(--sea-ink)]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <Messages messages={messages} />

          <div className="border-t border-[var(--line)] p-3">
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
                  className="demo-textarea pr-10 text-sm"
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
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-[var(--lagoon-deep)] transition-colors hover:text-[var(--sea-ink)] disabled:text-[var(--sea-ink-soft)]"
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
