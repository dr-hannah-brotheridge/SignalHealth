import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
})

export async function POST(request) {
  try {
    const authHeader = request.headers.get('Authorization')
    const token = authHeader?.replace('Bearer ', '')

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    )

    const { profile, userId } = await request.json()

    // Get conversation history
    const { data: conversation } = await supabase
      .from('conversations')
      .select('messages')
      .eq('user_id', userId)
      .single()

    const messages = conversation?.messages || []
    const recentMessages = messages.slice(-20).map(m => `${m.role}: ${m.content}`).join('\n')

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: `You are generating a structured GP summary for a patient. Use only confirmed information from their profile and conversation history. Do not invent or infer anything.

Patient Profile:
Name: ${profile?.name || 'Not provided'}
Age: ${profile?.age || 'Not provided'}
Gender: ${profile?.gender || 'Not provided'}
Ethnicity: ${profile?.ethnicity || 'Not provided'}
Medications: ${profile?.medications || 'None recorded'}
Known health problems: ${profile?.known_health_problems || 'None recorded'}
Family history: ${profile?.family_history || 'None recorded'}
Allergies: ${profile?.allergies || 'None recorded'}
Alcohol and smoking: ${profile?.alcohol_and_smoking || 'None recorded'}
Surgeries: ${profile?.surgeries || 'None recorded'}

Recent conversation highlights:
${recentMessages}

Generate a clear, structured GP summary with these sections:
- Patient Overview
- Current Concerns
- Medications
- Relevant Medical History
- Family History
- Lifestyle
- Suggested Discussion Points for GP

Keep it concise, clinical, and factual. Format each section on a new line with the section name followed by a colon.`
        }
      ]
    })

    return Response.json({ summary: response.content[0].text })
  } catch (err) {
    console.log('Summary error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}