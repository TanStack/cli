import { useStore } from '@tanstack/react-store'
import { Store } from '@tanstack/store'

import { X, ChevronRight, BotIcon } from 'lucide-react'

import { useAppChat } from './ai/demo-chat-registry'

export const showAIAssistant = new Store(false)

export default function AIAssistant() {
  const isOpen = useStore(showAIAssistant, (state) => state)
  const chat = useAppChat()

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

          <chat.AppChat />
        </div>
      )}
    </div>
  )
}
