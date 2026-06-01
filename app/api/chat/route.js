import Anthropic from '@anthropic-ai/sdk'
import { SYSTEM_PROMPT } from '../../../lib/prompt'
import { createClient } from '@supabase/supabase-js'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

export async function POST(request) {
  try {
    const { messages, userId } = await request.json()
    console.log('Saving conversation for userId:', userId)

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: messages.length === 0
        ? [{ role: 'user', content: 'Hello, I am opening the app for the first time.' }]
        : messages
    })

    const reply = response.content[0].text

    const updatedMessages = messages.length === 0
      ? [{ role: 'assistant', content: reply }]
      : [...messages, { role: 'assistant', content: reply }]

    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (existing) {
  const { error: updateError } = await supabase
    .from('conversations')
    .update({ messages: updatedMessages, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
  console.log('Update result:', updateError ? updateError.message : 'success')
} else {
  const { error: insertError } = await supabase
    .from('conversations')
    .insert({ user_id: userId, messages: updatedMessages })
  console.log('Insert result:', insertError ? insertError.message : 'success')
}

    return Response.json({ reply })
  } catch (err) {
    console.log('API error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}