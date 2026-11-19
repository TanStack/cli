import {
  fetchServerSentEvents,
  useChat,
  createChatClientOptions,
} from '@tanstack/ai-react'

export const useResumeChat = () => {
  const chatOptions = createChatClientOptions({
    threadId: 'resume-assistant',
    connection: fetchServerSentEvents('/api/resume-chat'),
  })

  return useChat(chatOptions)
}

export type ResumeChatMessages = ReturnType<typeof useResumeChat>['messages']
