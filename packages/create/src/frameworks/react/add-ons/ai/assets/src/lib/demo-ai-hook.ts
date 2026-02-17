import {
  fetchServerSentEvents,
  useChat,
  createChatClientOptions,
} from '@tanstack/ai-react'
import type { InferChatMessages } from '@tanstack/ai-react'
import { clientTools } from '@tanstack/ai-client'

import { recommendGuitarToolDef } from '#/lib/demo-guitar-tools'

const recommendGuitarToolClient = recommendGuitarToolDef.client(({ id }) => ({
  id: +id,
}))

const chatOptions = createChatClientOptions({
  connection: fetchServerSentEvents('/demo/api/ai/chat'),
  tools: clientTools(recommendGuitarToolClient),
})

export type ChatMessages = InferChatMessages<typeof chatOptions>

export const useGuitarRecommendationChat = () => useChat(chatOptions)
