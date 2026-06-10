import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

console.log('🔧 Check-ins API Configuration:')
console.log('  Supabase URL:', supabaseUrl ? '✅ Set' : '❌ Missing')
console.log('  Service Key:', supabaseServiceKey ? '✅ Set (length: ' + supabaseServiceKey.length + ')' : '❌ Missing')

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

// Configure VAPID
webpush.setVapidDetails(
  'mailto:signalhealth@example.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
)

// Helper function to calculate next check-in based on preferences
function calculateNextCheckIn(preferences) {
  if (!preferences.enabled || preferences.frequency === 'disabled') {
    return null
  }

  const now = new Date()
  const [hours, minutes] = preferences.time.split(':').map(Number)
  
  // Create a date in the user's timezone
  const userTimezone = preferences.timezone || 'UTC'
  const userDate = new Date(now.toLocaleString('en-US', { timeZone: userTimezone }))
  
  // Set the time
  userDate.setHours(hours, minutes, 0, 0)
  
  // If the time has already passed today, move to next occurrence
  if (userDate <= now) {
    switch (preferences.frequency) {
      case 'daily':
        userDate.setDate(userDate.getDate() + 1)
        break
      case 'weekly':
        if (preferences.days_of_week && preferences.days_of_week.length > 0) {
          // Find the next selected day
          const currentDay = userDate.getDay()
          const sortedDays = [...preferences.days_of_week].sort((a, b) => a - b)
          const nextDay = sortedDays.find(day => day > currentDay) || sortedDays[0]
          const daysToAdd = nextDay > currentDay 
            ? nextDay - currentDay 
            : 7 - currentDay + nextDay
          userDate.setDate(userDate.getDate() + daysToAdd)
        } else {
          userDate.setDate(userDate.getDate() + 7)
        }
        break
      case 'monthly':
        const dayOfMonth = preferences.day_of_month || 1
        const currentDayOfMonth = userDate.getDate()
        if (dayOfMonth > currentDayOfMonth) {
          userDate.setDate(dayOfMonth)
        } else {
          userDate.setMonth(userDate.getMonth() + 1)
          userDate.setDate(Math.min(dayOfMonth, new Date(userDate.getFullYear(), userDate.getMonth() + 1, 0).getDate()))
        }
        break
    }
  }
  
  // Convert back to UTC for storage
  return userDate.toISOString()
}

export async function GET(request) {
  // Verify this is a cron job (secret key)
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    console.log('🔄 Starting check-in notification job...')

    // Get all notification preferences that need check-ins
    const now = new Date().toISOString()
    const { data: preferences } = await supabaseAdmin
      .from('notification_preferences')
      .select('*')
      .lte('next_check_in_at', now)
      .eq('enabled', true)

    if (!preferences || preferences.length === 0) {
      console.log('✅ No check-ins due')
      return Response.json({ message: 'No check-ins due', sent: 0 })
    }

    console.log(`📋 Found ${preferences.length} users needing check-ins`)

    // Send notifications
    let sentCount = 0
    let failedCount = 0

    for (const pref of preferences) {
      try {
        // Get user's push subscriptions
        const { data: subscriptions } = await supabaseAdmin
          .from('push_subscriptions')
          .select('subscription')
          .eq('user_id', pref.user_id)

        if (!subscriptions || subscriptions.length === 0) {
          console.log(`⚠️ No subscription for user ${pref.user_id}`)
          continue
        }

        // Send notification to all subscriptions
        for (const { subscription } of subscriptions) {
          try {
            await webpush.sendNotification(subscription, JSON.stringify({
              title: '💚 Health Check-in',
              body: "It's time for your health check-in! How are you feeling today?",
              icon: '/icon.png',
              badge: '/icon.png',
              url: '/chat'
            }))
            sentCount++
            console.log(`✅ Sent notification to user ${pref.user_id}`)
          } catch (error) {
            failedCount++
            console.error(`❌ Failed to send to user ${pref.user_id}:`, error.message)
          }
        }

        // Calculate and update next check-in
        const nextCheckInAt = calculateNextCheckIn(pref)
        
        if (nextCheckInAt) {
          await supabaseAdmin
            .from('notification_preferences')
            .update({ 
              next_check_in_at: nextCheckInAt,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', pref.user_id)
          
          console.log(`📅 Next check-in for user ${pref.user_id}: ${nextCheckInAt}`)
        }

      } catch (error) {
        console.error(`❌ Error processing user ${pref.user_id}:`, error)
        failedCount++
      }
    }

    console.log(`✅ Job complete: ${sentCount} sent, ${failedCount} failed`)

    return Response.json({
      message: 'Check-in notifications sent',
      sent: sentCount,
      failed: failedCount
    })
  } catch (error) {
    console.error('❌ Check-in job failed:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
