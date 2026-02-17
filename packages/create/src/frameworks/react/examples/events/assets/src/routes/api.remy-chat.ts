import { createFileRoute } from '@tanstack/react-router'
import { chat, maxIterations, toServerSentEventsResponse } from '@tanstack/ai'
import { anthropicText } from '@tanstack/ai-anthropic'
import { openaiText } from '@tanstack/ai-openai'
import { geminiText } from '@tanstack/ai-gemini'
import { ollamaText } from '@tanstack/ai-ollama'

import {
  getSpeakerBySlug,
  getTalkBySlug,
  getAllSpeakers,
  getAllTalks,
  searchConference,
} from '#/lib/conference-tools'

export const Route = createFileRoute('/api/remy-chat')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const requestSignal = request.signal

        if (requestSignal.aborted) {
          return new Response(null, { status: 499 })
        }

        const abortController = new AbortController()

        try {
          const body = await request.json()
          const { messages, speakerSlug, talkSlug } = body
          const data = body.data || {}

          const SYSTEM_PROMPT = `You are Remy, a charming and knowledgeable culinary assistant for the Haute Pâtisserie 2026 conference in Paris. You have a warm, enthusiastic personality and deep appreciation for the art of pastry and baking.

PERSONALITY:
- Speak with warmth and a touch of French flair (occasional "magnifique!", "c'est parfait!", etc.)
- Be genuinely passionate about pastry, bread, and culinary arts
- Knowledgeable about techniques, ingredients, and the history of baking
- Helpful and encouraging to both novices and professionals

CAPABILITIES:
1. Use getSpeakerBySlug to get detailed information about a specific speaker
2. Use getTalkBySlug to get detailed information about a specific session
3. Use getAllSpeakers to see the complete speaker lineup
4. Use getAllTalks to see all available sessions
5. Use searchConference to find speakers or sessions matching a topic or keyword

INSTRUCTIONS:
- When asked about the conference, speakers, or sessions, use your tools to provide accurate information
- Help attendees find sessions that match their interests
- Share enthusiasm about the speakers and their expertise
- If asked about pastry techniques, you can provide general knowledge while recommending relevant sessions
- Keep responses conversational but informative
- When recommending sessions, explain why they might be interesting based on the user's query

${speakerSlug ? `CONTEXT: The user is viewing the profile of the speaker with slug "${speakerSlug}".` : ''}
${talkSlug ? `CONTEXT: The user is viewing the session with slug "${talkSlug}".` : ''}

Remember: You are the friendly face of Haute Pâtisserie 2026. Make every attendee feel welcome and excited about the culinary journey ahead!`

          // Determine the best available provider
          let provider: string = 'ollama'
          let model: string = 'mistral:7b'
          if (process.env.ANTHROPIC_API_KEY) {
            provider = 'anthropic'
            model = 'claude-haiku-4-5'
          } else if (process.env.OPENAI_API_KEY) {
            provider = 'openai'
            model = 'gpt-4o'
          } else if (process.env.GEMINI_API_KEY) {
            provider = 'gemini'
            model = 'gemini-2.0-flash-exp'
          }

          // Adapter factory pattern for multi-vendor support
          const adapterConfig = {
            anthropic: () =>
              anthropicText((model || 'claude-haiku-4-5') as any),
            openai: () => openaiText((model || 'gpt-4o') as any),
            gemini: () => geminiText((model || 'gemini-2.0-flash-exp') as any),
            ollama: () => ollamaText((model || 'mistral:7b') as any),
          }

          const adapter = adapterConfig[provider]()

          const stream = chat({
            adapter,
            tools: [
              getSpeakerBySlug,
              getTalkBySlug,
              getAllSpeakers,
              getAllTalks,
              searchConference,
            ],
            systemPrompts: [SYSTEM_PROMPT],
            agentLoopStrategy: maxIterations(5),
            messages,
            abortController,
          })

          return toServerSentEventsResponse(stream, { abortController })
        } catch (error: any) {
          console.error('Remy chat error:', error)
          if (error.name === 'AbortError' || abortController.signal.aborted) {
            return new Response(null, { status: 499 })
          }
          return new Response(
            JSON.stringify({
              error: 'Failed to process chat request',
              message: error.message,
            }),
            {
              status: 500,
              headers: { 'Content-Type': 'application/json' },
            },
          )
        }
      },
    },
  },
})
