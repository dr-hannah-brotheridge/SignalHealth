import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
  try {
    // Get user from session
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's notification preferences
    const { data: preferences, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      return Response.json({ error: error.message }, { status: 500 })
    }

    // Return preferences or default values
    return Response.json({
      preferences: preferences || {
        enabled: true,
        frequency: 'daily',
        days_of_week: [],
        day_of_month: 1,
        time: '09:00',
        timezone: 'UTC'
      }
    })
  } catch (error) {
    console.error('Error getting notification preferences:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    console.log('📥 POST /api/notification-preferences called')
    
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      console.error('❌ No auth header')
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      console.error('❌ Auth error:', authError)
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('✅ User authenticated:', user.id)

    const body = await request.json()
    const { enabled, frequency, days_of_week, day_of_month, time, timezone } = body
    
    console.log('📝 Received data:', { enabled, frequency, days_of_week, day_of_month, time, timezone })

    // Calculate next check-in
    const nextCheckInAt = calculateNextCheckIn({
      enabled,
      frequency,
      days_of_week,
      day_of_month,
      time,
      timezone
    })
    
    console.log('📅 Next check-in calculated:', nextCheckInAt)

    // Check if preferences already exist
    const { data: existingPrefs, error: queryError } = await supabase
      .from('notification_preferences')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (queryError && queryError.code !== 'PGRST116') {
      console.error('❌ Query error:', queryError)
      return Response.json({ error: queryError.message }, { status: 500 })
    }

    console.log('🔍 Existing preferences:', existingPrefs ? 'Found (ID: ' + existingPrefs.id + ')' : 'Not found')

    let preferences, error

    if (existingPrefs) {
      console.log('🔄 Updating existing record...')
      // Update existing record
      const result = await supabase
        .from('notification_preferences')
        .update({
          enabled: enabled !== undefined ? enabled : true,
          frequency: frequency || 'daily',
          days_of_week: days_of_week || [],
          day_of_month: day_of_month || 1,
          time: time || '09:00',
          timezone: timezone || 'UTC',
          next_check_in_at: nextCheckInAt,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingPrefs.id)
        .select()
        .single()
      
      preferences = result.data
      error = result.error
      
      if (error) {
        console.error('❌ Update error:', error)
      } else {
        console.log('✅ Update successful:', preferences)
      }
    } else {
      console.log('➕ Inserting new record...')
      // Insert new record
      const result = await supabase
        .from('notification_preferences')
        .insert({
          user_id: user.id,
          enabled: enabled !== undefined ? enabled : true,
          frequency: frequency || 'daily',
          days_of_week: days_of_week || [],
          day_of_month: day_of_month || 1,
          time: time || '09:00',
          timezone: timezone || 'UTC',
          next_check_in_at: nextCheckInAt,
          updated_at: new Date().toISOString()
        })
        .select()
        .single()
      
      preferences = result.data
      error = result.error
      
      if (error) {
        console.error('❌ Insert error:', error)
      } else {
        console.log('✅ Insert successful:', preferences)
      }
    }

    if (error) {
      console.error('❌ Error saving notification preferences:', error)
      return Response.json({ error: error.message }, { status: 500 })
    }

    console.log('✅ Returning success response')
    return Response.json({ 
      success: true, 
      preferences,
      message: 'Notification preferences saved successfully'
    })
  } catch (error) {
    console.error('❌ Error saving notification preferences:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
