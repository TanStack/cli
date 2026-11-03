import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { runInNewContext } from 'node:vm'

import ts from 'typescript'
import { describe, expect, it } from 'vitest'

const routePath = fileURLToPath(
  new URL(
    '../src/frameworks/react/examples/events/assets/src/routes/api.remy-chat.ts',
    import.meta.url,
  ),
)

function loadRoute() {
  const prompts: Array<Array<string>> = []
  const routeModule: {
    Route?: {
      server: {
        handlers: {
          POST: (context: { request: Request }) => Promise<Response>
        }
      }
    }
  } = {}
  const provider = (model: string) => ({ model })
  const modules: Record<string, object> = {
    '@tanstack/react-router': {
      createFileRoute: () => (route: object) => route,
    },
    '@tanstack/ai': {
      chat: (options: { systemPrompts: Array<string> }) => {
        prompts.push(options.systemPrompts)
        return []
      },
      maxIterations: () => () => true,
      toServerSentEventsResponse: () => new Response('mock stream'),
    },
    '@tanstack/ai-anthropic': { anthropicText: provider },
    '@tanstack/ai-openai': { openaiText: provider },
    '@tanstack/ai-gemini': { geminiText: provider },
    '@tanstack/ai-ollama': { ollamaText: provider },
    '#/lib/conference-tools': {},
  }
  const compiled = ts.transpileModule(readFileSync(routePath, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  })
  runInNewContext(compiled.outputText, {
    exports: routeModule,
    require: (name: string) => {
      if (!(name in modules)) throw new Error(`Unexpected import: ${name}`)
      return modules[name]
    },
    process: { env: {} },
    Response,
    AbortController,
    console,
  })
  if (!routeModule.Route) throw new Error('Events route did not load')
  return { post: routeModule.Route.server.handlers.POST, prompts }
}

async function requestContext(body: object) {
  const route = loadRoute()
  const response = await route.post({
    request: new Request('http://localhost/api/remy-chat', {
      method: 'POST',
      body: JSON.stringify({ messages: [], threadId: 'conference', ...body }),
      headers: { 'Content-Type': 'application/json' },
    }),
  })
  return { response, prompts: route.prompts.flat().join('\n') }
}

describe('events chat page context', () => {
  it('reads speaker and talk context from the transport forwardedProps', async () => {
    const { response, prompts } = await requestContext({
      forwardedProps: { speakerSlug: 'alice', talkSlug: 'pastry' },
    })
    expect(response.status).toBe(200)
    expect(prompts).toContain('speaker with slug "alice"')
    expect(prompts).toContain('session with slug "pastry"')
  })

  it('preserves clients that send top-level context', async () => {
    const { prompts } = await requestContext({ speakerSlug: 'alice' })
    expect(prompts).toContain('speaker with slug "alice"')
  })

  it('uses the current transport context when both payload shapes are present', async () => {
    const { prompts } = await requestContext({
      speakerSlug: 'old-speaker',
      forwardedProps: { speakerSlug: 'current-speaker' },
    })
    expect(prompts).toContain('speaker with slug "current-speaker"')
    expect(prompts).not.toContain('speaker with slug "old-speaker"')
  })

  it('ignores non-string context instead of adding it to the prompt', async () => {
    const { prompts } = await requestContext({
      forwardedProps: { speakerSlug: { invalid: true }, talkSlug: ['invalid'] },
    })
    expect(prompts).not.toContain('CONTEXT:')
  })

  it('allows requests without page context', async () => {
    const { response, prompts } = await requestContext({})
    expect(response.status).toBe(200)
    expect(prompts).not.toContain('CONTEXT:')
  })

  it('keeps the missing-thread response and does not start a chat', async () => {
    const { response, prompts } = await requestContext({ threadId: '' })
    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'A threadId is required' })
    expect(prompts).toBe('')
  })
})
