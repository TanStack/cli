import { useEffect, useRef, useState } from 'react'
import { Send, X, ChefHat, Croissant } from 'lucide-react'
import { Streamdown } from 'streamdown'
import { Store } from '@tanstack/store'

import { useConferenceChat } from '#/lib/conference-ai-hook'
import type { ConferenceChatMessages } from '#/lib/conference-ai-hook'

function Messages({ messages }: { messages: ConferenceChatMessages }) {
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight
    }
  }, [messages])

  if (!messages.length) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-cream/60 text-sm px-6 py-8">
        <div className="relative mb-4">
          <ChefHat className="w-12 h-12 text-copper/60 animate-pulse" />
          <Croissant className="w-6 h-6 text-gold/60 absolute -bottom-1 -right-1" />
        </div>
        <p className="text-center text-cream/80 font-medium font-display text-lg">
          Bonjour! I'm Remy 👨‍🍳
        </p>
        <p className="text-xs text-cream/40 mt-2 text-center max-w-[220px]">
          Your culinary guide to Haute Pâtisserie 2026. Ask about speakers, sessions, or pastry techniques!
        </p>
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
              ? 'bg-gradient-to-r from-copper/5 via-gold/5 to-copper/5'
              : 'bg-transparent'
          }`}
        >
          {parts.map((part, index) => {
            if (part.type === 'text' && part.content) {
              return (
                <div key={index} className="flex items-start gap-3 px-4">
                  {role === 'assistant' ? (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-copper via-copper-dark to-gold flex items-center justify-center text-xs font-bold text-charcoal flex-shrink-0 shadow-lg shadow-copper/20">
                      👨‍🍳
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-charcoal-light flex items-center justify-center text-xs font-medium text-cream flex-shrink-0 border border-border/50">
                      You
                    </div>
                  )}
                  <div className="flex-1 min-w-0 text-cream prose dark:prose-invert max-w-none prose-sm prose-p:text-cream prose-headings:text-cream prose-strong:text-gold">
                    <Streamdown>{part.content}</Streamdown>
                  </div>
                </div>
              )
            }
            return null
          })}
        </div>
      ))}
    </div>
  )
}

interface RemyAssistantProps {
  speakerSlug?: string
  talkSlug?: string
  contextTitle?: string
}

// Export store for header control
export const showRemyAssistant = new Store(false)

export default function RemyAssistant({
  speakerSlug,
  talkSlug,
  contextTitle,
}: RemyAssistantProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { messages, sendMessage, isLoading } = useConferenceChat(speakerSlug, talkSlug)
  const [input, setInput] = useState('')

  // Sync with store for header control
  useEffect(() => {
    return showRemyAssistant.subscribe(() => {
      setIsOpen(showRemyAssistant.state)
    })
  }, [])

  const handleToggle = () => {
    const newState = !isOpen
    setIsOpen(newState)
    showRemyAssistant.setState(() => newState)
  }

  const handleSend = () => {
    if (input.trim()) {
      sendMessage(input)
      setInput('')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed top-36 right-4 z-[100] w-[400px] h-[520px] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-copper/20 backdrop-blur-xl bg-gradient-to-b from-charcoal/98 via-charcoal/95 to-charcoal-light/98">
      {/* Decorative top gradient */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-copper/10 via-gold/5 to-transparent pointer-events-none" />

      {/* Header */}
      <div className="relative flex items-center justify-between p-4 border-b border-copper/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-copper via-copper-dark to-gold flex items-center justify-center shadow-lg shadow-copper/30 rotate-3 hover:rotate-0 transition-transform">
            <span className="text-lg">👨‍🍳</span>
          </div>
          <div>
            <h3 className="font-display font-bold text-cream text-base tracking-tight">
              Remy
            </h3>
            {contextTitle && (
              <p className="text-xs text-copper/70 truncate max-w-[220px]">
                🥐 {contextTitle}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={handleToggle}
          className="text-cream/50 hover:text-cream transition-colors p-2 hover:bg-white/5 rounded-xl"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <Messages messages={messages} />

      {/* Loading indicator */}
      {isLoading && (
        <div className="px-4 py-3 border-t border-copper/10">
          <div className="flex items-center gap-2 text-copper/80 text-xs">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-copper rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-2 h-2 bg-gold rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-2 h-2 bg-copper-light rounded-full animate-bounce"></span>
            </div>
            <span className="font-medium">Crafting a response...</span>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="relative p-4 border-t border-copper/10 bg-charcoal/50">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSend()
          }}
        >
          <div className="relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about speakers, sessions, techniques..."
              disabled={isLoading}
              className="w-full rounded-xl border border-copper/20 bg-charcoal-light/50 pl-4 pr-12 py-3 text-sm text-cream placeholder-cream/30 focus:outline-none focus:ring-2 focus:ring-copper/40 focus:border-transparent resize-none overflow-hidden disabled:opacity-50 transition-all"
              rows={1}
              style={{ minHeight: '48px', maxHeight: '100px' }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement
                target.style.height = 'auto'
                target.style.height = Math.min(target.scrollHeight, 100) + 'px'
              }}
              onKeyDown={(e) => {
                if (
                  e.key === 'Enter' &&
                  !e.shiftKey &&
                  input.trim() &&
                  !isLoading
                ) {
                  e.preventDefault()
                  handleSend()
                }
              }}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-gradient-to-r from-copper to-copper-dark text-charcoal disabled:opacity-30 disabled:bg-gray-600 disabled:from-gray-600 disabled:to-gray-600 transition-all hover:shadow-lg hover:shadow-copper/20"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
