import { fetchServerSentEvents, useChat } from '@tanstack/ai-react'
import type { InferChatMessages } from '@tanstack/ai-react'
import { clientTools } from '@tanstack/ai-client'

import { recommendGuitarToolDef } from '#/lib/demo-guitar-tools'

const recommendGuitarToolClient = recommendGuitarToolDef.client(({ id }) => ({
  id: +id,
}))

// A plain options object (rather than `createChatClientOptions`) so the
// `@tanstack/ai-react/ui` type helpers can structurally read `tools` and
// infer the named tools for the chat hook registry.
export const chatOptions = {
  connection: fetchServerSentEvents('/demo/api/ai/chat'),
  tools: clientTools(recommendGuitarToolClient),
}

export type ChatMessages = InferChatMessages<typeof chatOptions>

export const useGuitarRecommendationChat = () => useChat(chatOptions)
