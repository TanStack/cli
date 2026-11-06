import express, { Request, Response } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import Anthropic from '@anthropic-ai/sdk'

// Load environment variables
dotenv.config()

const app = express()
const port = process.env.PORT || 8080

// Middleware
app.use(cors())
app.use(express.json())

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// Define types for the request body
interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface ChatRequest {
  messages: ChatMessage[]
}

// Streaming chat endpoint
app.post(
  '/api/chat',
  async (req: Request<{}, {}, ChatRequest>, res: Response) => {
    try {
      const { messages } = req.body

      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: 'Messages array is required' })
      }

      // Validate message format
      const isValidMessages = messages.every(
        (msg): msg is ChatMessage =>
          typeof msg === 'object' &&
          (msg.role === 'user' || msg.role === 'assistant') &&
          typeof msg.content === 'string',
      )

      if (!isValidMessages) {
        return res.status(400).json({
          error:
            "Invalid message format. Each message must have 'role' and 'content'",
        })
      }

      // Set up SSE headers
      res.setHeader('Content-Type', 'text/event-stream')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('Connection', 'keep-alive')

      // Create the message stream
      const stream = await anthropic.messages.create({
        messages: messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        model: 'claude-haiku-4-5',
        max_tokens: 4096,
        stream: true,
      })

      // Stream the response
      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta') {
          res.write(`data: ${JSON.stringify(chunk)}\n\n`)
        }
      }

      // End the stream
      res.write('data: [DONE]\n\n')
      res.end()
    } catch (error) {
      console.error('Error:', error)
      // If headers haven't been sent yet, send error response
      if (!res.headersSent) {
        res.status(500).json({ error: 'Internal server error' })
      } else {
        // If streaming has started, send error event
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error'
        res.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`)
        res.end()
      }
    }
  },
)

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})
