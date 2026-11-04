import {
  fetchServerSentEvents,
  useChat,
  createChatClientOptions,
} from '@tanstack/ai-react'

export const useConferenceChat = (speakerSlug?: string, talkSlug?: string) => {
  const chatOptions = createChatClientOptions({
    threadId: 'conference-assistant',
    connection: fetchServerSentEvents('/api/remy-chat', {
      body: {
        speakerSlug,
        talkSlug,
      },
    }),
  })

  return useChat(chatOptions)
}

export type ConferenceChatMessages = ReturnType<typeof useConferenceChat>['messages']
