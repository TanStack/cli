import { useEffect, useRef, useState } from 'react'
import { createChatHook } from '@tanstack/ai-react/ui'
import type {
  LayoutProps,
  MessageProps,
  PartProps,
  ToolProps,
} from '@tanstack/ai-react/ui'

import { Send } from 'lucide-react'
import { Streamdown } from 'streamdown'

import { chatOptions } from '#/lib/demo-ai-hook'
import GuitarRecommendation from '#/components/demo-GuitarRecommendation'

import {
  chatContext,
  interruptContext,
  partContext,
} from './demo-ai-ui-context'

// The chrome around the message list. `Messages` and `Input` are supplied by
// the kit; this component owns the scroll container and auto-scroll behaviour.
function ChatLayout({ Messages, Input }: LayoutProps<typeof chatOptions>) {
  const chat = useChatContext()
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [chat.messages])

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {chat.error ? (
        <p className="p-4 text-sm text-red-500">{chat.error.message}</p>
      ) : null}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {chat.messages.length === 0 ? (
          <div className="demo-muted flex h-full items-center justify-center text-sm">
            Ask me anything! I'm here to help.
          </div>
        ) : (
          <Messages />
        )}
      </div>
      <div className="border-t border-[var(--line)] p-3">
        <Input />
      </div>
    </div>
  )
}

// One message row: an avatar chip plus the automatically-dispatched parts.
function ChatMessage({ message, Parts }: MessageProps<typeof chatOptions>) {
  const isAssistant = message.role === 'assistant'
  return (
    <div className={`py-3 ${isAssistant ? 'bg-[var(--chip-bg)]' : ''}`}>
      <div className="flex items-start gap-2 px-4">
        <div
          className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg text-xs font-medium text-white ${
            isAssistant ? 'bg-[var(--lagoon-deep)]' : 'bg-[var(--sea-ink-soft)]'
          }`}
        >
          {isAssistant ? 'AI' : 'Y'}
        </div>
        <div className="min-w-0 flex-1 max-w-none text-sm text-[var(--sea-ink)]">
          <Parts />
        </div>
      </div>
    </div>
  )
}

// The message composer.
function ChatInput() {
  const chat = useChatContext()
  const [input, setInput] = useState('')

  const send = () => {
    const trimmed = input.trim()
    if (!trimmed) return
    void chat.sendMessage(trimmed)
    setInput('')
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        send()
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
            target.style.height = Math.min(target.scrollHeight, 120) + 'px'
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              send()
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
  )
}

// Markdown text part.
function TextPart({ part }: PartProps<typeof chatOptions, 'text'>) {
  if (!part.content) return null
  return <Streamdown>{part.content}</Streamdown>
}

// Anything the assistant emits that we don't render explicitly (e.g. the
// server-side getGuitars lookup) is intentionally suppressed.
function FallbackPart() {
  return null
}

// The recommendGuitar client tool renders the rich guitar card.
function RecommendGuitarTool({
  part,
}: ToolProps<typeof chatOptions, 'recommendGuitar'>) {
  if (!part.output) return null
  return (
    <div className="mx-auto max-w-[80%]">
      <GuitarRecommendation id={String(part.output.id)} />
    </div>
  )
}

export const { useAppChat, useChatContext } = createChatHook({
  options: chatOptions,
  context: {
    chatContext,
    partContext,
    interruptContext,
  },
  components: {
    layout: ChatLayout,
    message: ChatMessage,
    input: ChatInput,
  },
  partsComponents: {
    text: TextPart,
    fallback: FallbackPart,
  },
  toolsComponents: {
    recommendGuitar: RecommendGuitarTool,
  },
})
