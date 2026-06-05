import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

// Configure VAPID
webpush.setVapidDetails(
  'mailto:signalhealth@example.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
)

export async function POST(request) {
  try {
    const { userId, title, body } = await request.json()

    if (!userId) {
      return Response.json({ error: 'userId is required' }, { status: 400 })
    }

    // Get user's push subscription
    const { data: subscriptions } = await supabaseAdmin
      .from('push_subscriptions')
      .select('subscription')
      .eq('user_id', userId)

    if (!subscriptions || subscriptions.length === 0) {
      return Response.json({ error: 'No push subscription found for this user' }, { status: 404 })
    }

    // Send notification to all subscriptions for this user
    const results = []
    for (const { subscription } of subscriptions) {
      try {
        await webpush.sendNotification(subscription, JSON.stringify({
          title: title || 'Test Notification',
          body: body || 'This is a test notification from SignalHealth!',
          icon: '/icon.png',
          badge: '/icon.png',
          url: '/chat'
        }))
        results.push({ success: true, subscription })
      } catch (error) {
        console.error('Failed to send notification:', error)
        results.push({ success: false, error: error.message, subscription })
      }
    }

    const successful = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length

    return Response.json({
      message: `Sent ${successful} notification(s), ${failed} failed`,
      details: results
    })
  } catch (error) {
    console.error('Error sending test notification:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}