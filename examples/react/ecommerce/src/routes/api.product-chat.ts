import { createFileRoute } from "@tanstack/react-router";
import { chat, maxIterations, toServerSentEventsResponse } from "@tanstack/ai";
import { anthropicText } from "@tanstack/ai-anthropic";

import {
  getProducts,
  recommendProductToolDef,
} from "@/lib/product-tools";

const SYSTEM_PROMPT = `You are a helpful assistant for a store that sells TanStack-themed products.

You should be practical, friendly, and opinionated about helping teams choose the right product for their goals.

CRITICAL INSTRUCTIONS - YOU MUST FOLLOW THIS EXACT WORKFLOW:

When a user asks for a product recommendation:
1. FIRST: Use the getProducts tool (no parameters needed)
2. SECOND: Use the recommendProduct tool with the ID of the product you want to recommend
3. NEVER write a recommendation directly - ALWAYS use the recommendProduct tool

IMPORTANT:
- The recommendProduct tool will display the product in a special format
- You MUST use recommendProduct for ANY product recommendation
- ONLY recommend products from our inventory (use getProducts first)
- The recommendProduct tool has a view details button
- Do NOT describe the product yourself - let the recommendProduct tool do it
`;

export const Route = createFileRoute("/api/product-chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const requestSignal = request.signal;

        if (requestSignal.aborted) {
          return new Response(null, { status: 499 });
        }

        const abortController = new AbortController();

        try {
          const body = await request.json();
          const { messages } = body;

          const adapter = anthropicText("claude-haiku-4-5");

          const stream = chat({
            adapter,
            tools: [
              getProducts,
              recommendProductToolDef,
            ],
            systemPrompts: [SYSTEM_PROMPT],
            agentLoopStrategy: maxIterations(5),
            messages,
            abortController,
          });

          return toServerSentEventsResponse(stream, { abortController });
        } catch (error: any) {
          if (error.name === "AbortError" || abortController.signal.aborted) {
            return new Response(null, { status: 499 });
          }
          return new Response(
            JSON.stringify({ error: "Failed to process chat request" }),
            {
              status: 500,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
      },
    },
  },
});
