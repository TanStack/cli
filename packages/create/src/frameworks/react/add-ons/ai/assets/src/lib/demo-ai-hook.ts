import {
  fetchServerSentEvents,
  useChat,
  createChatClientOptions,
} from '@tanstack/ai-react'
import { clientTools } from '@tanstack/ai-client'

import { recommendGuitarToolDef } from '#/lib/demo-guitar-tools'

const recommendGuitarToolClient = recommendGuitarToolDef.client(({ id }) => ({
  id: +id,
}))

const chatOptions = createChatClientOptions({
  threadId: 'guitar-recommendations',
  connection: fetchServerSentEvents('/demo/api/ai/chat'),
  tools: clientTools(recommendGuitarToolClient),
})

export const useGuitarRecommendationChat = () => useChat(chatOptions)

export type ChatMessages = ReturnType<
  typeof useGuitarRecommendationChat
>['messages']
