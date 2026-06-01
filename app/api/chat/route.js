import Anthropic from '@anthropic-ai/sdk'
import { SYSTEM_PROMPT } from '../../../lib/prompt'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
})

export async function POST(request) {
  const { messages } = await request.json()

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    system: SYSTEM_PROMPT,
    messages: messages.length === 0
      ? [{ role: 'user', content: 'Hello, I am opening the app for the first time.' }]
      : messages
  })

  return Response.json({ reply: response.content[0].text })
}