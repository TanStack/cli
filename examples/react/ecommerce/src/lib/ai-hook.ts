import {
  fetchServerSentEvents,
  useChat,
  createChatClientOptions,
} from "@tanstack/ai-react";
import type { InferChatMessages } from "@tanstack/ai-react";
import { clientTools } from "@tanstack/ai-client";

import { recommendProductToolDef } from "@/lib/product-tools";

const recommendProductToolClient = recommendProductToolDef.client((args) => {
  const input = args as { id: string | number };
  return {
    id: +input.id,
  };
});

const chatOptions = createChatClientOptions({
  connection: fetchServerSentEvents("/api/product-chat"),
  tools: clientTools(recommendProductToolClient),
});

export type ChatMessages = InferChatMessages<typeof chatOptions>;

export const useProductChat = () => useChat(chatOptions);
