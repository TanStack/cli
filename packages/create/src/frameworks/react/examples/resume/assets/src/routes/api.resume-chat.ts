import { createFileRoute } from '@tanstack/react-router'
import { chat, maxIterations, toServerSentEventsResponse } from '@tanstack/ai'
import { anthropicText } from '@tanstack/ai-anthropic'
import { openaiText } from '@tanstack/ai-openai'
import { geminiText } from '@tanstack/ai-gemini'
import { ollamaText } from '@tanstack/ai-ollama'

import {
  getJobsBySkill,
  getAllJobs,
  getAllEducation,
  searchExperience,
} from '#/lib/resume-tools'

export const Route = createFileRoute('/api/resume-chat')({
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
          const { messages } = body
          const data = body.data || {}

          const SYSTEM_PROMPT = `You are a helpful resume assistant helping recruiters and hiring managers evaluate if this candidate is a good fit for their job requirements.

CAPABILITIES:
1. Use getJobsBySkill to find jobs where the candidate used specific technologies or skills
2. Use getAllJobs to get the candidate's complete work history with all details
3. Use getAllEducation to get the candidate's educational background
4. Use searchExperience to search for specific types of roles or experience by keywords

INSTRUCTIONS:
- When asked about specific technologies or skills, use getJobsBySkill to find relevant experience
- When asked about overall experience or career progression, use getAllJobs
- When asked about education or training, use getAllEducation
- When asked about specific types of roles (e.g., "senior", "lead"), use searchExperience
- Be professional, concise, and helpful in your responses
- Provide specific details from the resume when available
- When calculating years of experience, consider the date ranges provided
- If the candidate has experience with something, highlight specific roles and time periods
- If the candidate lacks certain experience, be honest but constructive

CONTEXT: You are helping evaluate this candidate's qualifications for potential job opportunities.`

          // Determine the best available provider
          let provider: 'anthropic' | 'openai' | 'gemini' | 'ollama' = data.provider || 'ollama'
          let model: string = data.model || 'mistral:7b'

          // Use the first available provider with an API key, fallback to ollama
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
          // else keep ollama as default

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
            tools: [getJobsBySkill, getAllJobs, getAllEducation, searchExperience],
            systemPrompts: [SYSTEM_PROMPT],
            agentLoopStrategy: maxIterations(5),
            messages,
            abortController,
          })

          return toServerSentEventsResponse(stream, { abortController })
        } catch (error: any) {
          console.error('Resume chat error:', error)
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
