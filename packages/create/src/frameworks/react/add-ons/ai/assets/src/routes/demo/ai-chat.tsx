import { useEffect, useRef, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  Send,
  Square,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Loader2,
} from 'lucide-react'
import { Streamdown } from 'streamdown'

import { useGuitarRecommendationChat } from '#/lib/demo-ai-hook'
import type { ChatMessages } from '#/lib/demo-ai-hook'
import { useAudioRecorder } from '#/hooks/demo-useAudioRecorder'
import { useTTS } from '#/hooks/demo-useTTS'

import GuitarRecommendation from '#/components/demo-GuitarRecommendation'

import './ai-chat.css'

function InitialLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 flex items-center justify-center px-4">
      <div className="text-center max-w-3xl mx-auto w-full">
        <h1 className="text-6xl font-bold mb-4 bg-linear-to-r from-orange-500 to-red-600 text-transparent bg-clip-text uppercase">
          <span className="text-white">TanStack</span> Chat
        </h1>
        <p className="text-gray-400 mb-6 w-2/3 mx-auto text-lg">
          You can ask me about anything, I might or might not have a good
          answer, but you can still ask.
        </p>
        {children}
      </div>
    </div>
  )
}

function ChattingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="sticky bottom-0 left-0 right-0 bg-gray-900/80 backdrop-blur-sm border-t border-orange-500/10 z-10">
      <div className="max-w-3xl mx-auto w-full px-4 py-3">{children}</div>
    </div>
  )
}

function Messages({
  messages,
  playingId,
  onSpeak,
  onStopSpeak,
}: {
  messages: ChatMessages
  playingId: string | null
  onSpeak: (text: string, id: string) => void
  onStopSpeak: () => void
}) {
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight
    }
  }, [messages])

  if (!messages.length) {
    return null
  }

  // Extract text content from message parts
  const getTextContent = (
    parts: ChatMessages[number]['parts'],
  ): string | null => {
    for (const part of parts) {
      if (part.type === 'text' && part.content) {
        return part.content
      }
    }
    return null
  }

  return (
    <div
      ref={messagesContainerRef}
      className="flex-1 overflow-y-auto pb-4 min-h-0"
    >
      <div className="max-w-3xl mx-auto w-full px-4">
        {messages.map((message) => {
          const textContent = getTextContent(message.parts)
          const isPlaying = playingId === message.id

          return (
            <div
              key={message.id}
              className={`p-4 ${
                message.role === 'assistant'
                  ? 'bg-linear-to-r from-orange-500/5 to-red-600/5'
                  : 'bg-transparent'
              }`}
            >
              <div className="flex items-start gap-4 max-w-3xl mx-auto w-full">
                {message.role === 'assistant' ? (
                  <div className="w-8 h-8 rounded-lg bg-linear-to-r from-orange-500 to-red-600 mt-2 flex items-center justify-center text-sm font-medium text-white flex-shrink-0">
                    AI
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center text-sm font-medium text-white flex-shrink-0">
                    Y
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  {message.parts.map((part, index) => {
                    if (part.type === 'text' && part.content) {
                      return (
                        <div
                          className="flex-1 min-w-0 prose dark:prose-invert max-w-none prose-sm"
                          key={index}
                        >
                          <Streamdown>{part.content}</Streamdown>
                        </div>
                      )
                    }
                    // Guitar recommendation card
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
                    return null
                  })}
                </div>
                {/* TTS button for assistant messages */}
                {message.role === 'assistant' && textContent && (
                  <button
                    onClick={() =>
                      isPlaying
                        ? onStopSpeak()
                        : onSpeak(textContent, message.id)
                    }
                    className="flex-shrink-0 p-2 text-gray-400 hover:text-orange-400 transition-colors"
                    title={isPlaying ? 'Stop speaking' : 'Read aloud'}
                  >
                    {isPlaying ? (
                      <VolumeX className="w-4 h-4" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ChatPage() {
  const [input, setInput] = useState('')

  const { isRecording, isTranscribing, startRecording, stopRecording } =
    useAudioRecorder()
  const { playingId, speak, stop: stopTTS } = useTTS()

  const { messages, sendMessage, isLoading, stop } =
    useGuitarRecommendationChat()

  const handleMicClick = async () => {
    if (isRecording) {
      const transcribedText = await stopRecording()
      if (transcribedText) {
        setInput((prev) =>
          prev ? `${prev} ${transcribedText}` : transcribedText,
        )
      }
    } else {
      await startRecording()
    }
  }

  const Layout = messages.length ? ChattingLayout : InitialLayout

  return (
    <div className="relative flex h-[calc(100vh-80px)] bg-gray-900">
      <div className="flex-1 flex flex-col min-h-0">
        <Messages
          messages={messages}
          playingId={playingId}
          onSpeak={speak}
          onStopSpeak={stopTTS}
        />

        <Layout>
          <div className="space-y-3">
            {isLoading && (
              <div className="flex items-center justify-center">
                <button
                  onClick={stop}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <Square className="w-4 h-4 fill-current" />
                  Stop
                </button>
              </div>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (input.trim()) {
                  sendMessage(input)
                  setInput('')
                }
              }}
            >
              <div className="relative max-w-xl mx-auto flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleMicClick}
                  disabled={isLoading || isTranscribing}
                  className={`p-3 rounded-lg transition-colors ${
                    isRecording
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-gray-800/50 text-gray-400 hover:text-orange-400 border border-orange-500/20'
                  } disabled:opacity-50`}
                  title={isRecording ? 'Stop recording' : 'Start recording'}
                >
                  {isTranscribing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isRecording ? (
                    <MicOff className="w-4 h-4" />
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                </button>

                <div className="relative flex-1">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type something clever..."
                    className="w-full rounded-lg border border-orange-500/20 bg-gray-800/50 pl-4 pr-12 py-3 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-transparent resize-none overflow-hidden shadow-lg"
                    rows={1}
                    style={{ minHeight: '44px', maxHeight: '200px' }}
                    disabled={isLoading}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement
                      target.style.height = 'auto'
                      target.style.height =
                        Math.min(target.scrollHeight, 200) + 'px'
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
                    disabled={!input.trim() || isLoading}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-orange-500 hover:text-orange-400 disabled:text-gray-500 transition-colors focus:outline-none"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </form>
          </div>
        </Layout>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/demo/ai/chat')({
  component: ChatPage,
})
