# Push Notifications Testing Guide

## Prerequisites

Before testing push notifications, ensure you have:

1. **Environment Variables** configured in `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key
   SUPABASE_SERVICE_KEY=your_service_key
   ANTHROPIC_API_KEY=your_anthropic_key
   ```

2. **VAPID Keys** generated:
   ```bash
   # Generate VAPID keys (one-time setup)
   npx web-push generate-vapid-keys
   ```

3. **Supabase Database** with the `push_subscriptions` table created:
   ```sql
   CREATE TABLE push_subscriptions (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID NOT NULL REFERENCES auth.users(id),
     subscription JSONB NOT NULL,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   
   CREATE INDEX idx_push_subscriptions_user_id ON push_subscriptions(user_id);
   ```

## Testing Steps

### 1. Start the Application

```bash
npm run dev
```

Open your browser's DevTools Console (F12) to see detailed logging.

### 2. Check Environment Status

When the app loads, you should see:
```
🔧 Environment Status:
====================
✅ All required environment variables are configured
====================
```

If you see errors, check your `.env.local` file.

### 3. Check Service Worker Registration

Look for these console messages:
```
Service Worker registered successfully: https://your-domain/sw.js
Service Worker is already active
```

If you see errors:
- "Service Workers are not supported" - Try a modern browser (Chrome, Firefox, Safari)
- "Service Worker registration failed" - Check the sw.js file exists in `public/`

### 4. Test Push Notification Subscription

1. Log in to the app
2. Click the "Enable Alerts" button in the header
3. You should see a browser permission prompt
4. Click "Allow"

**Expected Console Output:**
```
🔔 Starting push notification subscription...
⏳ Waiting for service worker to be ready...
✅ Service worker is ready: https://your-domain/sw.js
⏳ Requesting notification permission...
📱 Permission result: granted
✅ Permission granted
⏳ Getting or creating push subscription...
📝 Creating new push subscription...
✅ New subscription created
🔐 Checking authentication...
✅ User authenticated: [user-id]
💾 Saving subscription to database...
📦 Subscription data: { endpoint: '...', keys: 'present' }
✅ Subscription saved successfully
```

**Expected User Feedback:**
- Success: Alert saying "Notifications enabled successfully!" or "Notifications are already enabled!"
- Error: Alert with specific error message

### 5. Verify Database Entry

Check your Supabase database:
```sql
SELECT * FROM push_subscriptions WHERE user_id = 'your-user-id';
```

You should see a record with:
- `user_id`: Your user's UUID
- `subscription`: JSON object containing endpoint and keys
- `created_at`: Timestamp

### 6. Test Notification Permission States

**Test Denial:**
1. Clear browser data/site settings
2. Click "Enable Alerts"
3. Click "Block" in the permission prompt
4. Expected: Alert saying "Notification permission was denied. Please enable notifications in your browser settings."

**Test Already Enabled:**
1. Click "Enable Alerts" again after successful subscription
2. Expected: Alert saying "Notifications are already enabled!"

### 7. Common Issues & Solutions

#### Issue: "VAPID key not configured"
**Solution:** Add `NEXT_PUBLIC_VAPID_PUBLIC_KEY` to your `.env.local` file

#### Issue: "Service worker not ready"
**Solution:** Refresh the page and try again. The service worker needs time to initialize.

#### Issue: "Service Workers are not supported"
**Solution:** Use a modern browser with PWA support (Chrome, Firefox, Safari, Edge)

#### Issue: "Not authenticated"
**Solution:** Make sure you're logged in before enabling notifications

#### Issue: Subscription not saving to database
**Solution:** 
- Check Supabase RLS policies allow insert on `push_subscriptions`
- Verify your database connection
- Check console for specific error messages

#### Issue: Duplicate subscription error
**Solution:** This is normal - the system handles duplicates gracefully

### 8. Debugging Tips

**Enable Detailed Logging:**
All push notification operations are logged with emoji indicators:
- 🔔 Starting operation
- ⏳ Waiting/In progress
- ✅ Success
- ❌ Error
- ℹ️ Information
- 📱 Permission related
- 🔐 Authentication related
- 💾 Database related
- 📦 Data related

**Check Browser Console:**
Open DevTools (F12) and look at the Console tab for detailed logs.

**Check Network Tab:**
Look for failed requests to Supabase in the Network tab.

**Test on Mobile:**
For best results, test on a mobile device or use Chrome DevTools device emulation:
1. Open DevTools (F12)
2. Click the device toolbar icon (or press Ctrl+Shift+M)
3. Select a mobile device
4. Test the notification flow

### 9. Production Deployment

When deploying to production:

1. **HTTPS Required:** Push notifications only work over HTTPS
2. **VAPID Keys:** Use production VAPID keys, not development keys
3. **Service Worker:** Ensure `sw.js` is served from the root
4. **Manifest:** Verify `manifest.json` is properly configured
5. **Environment Variables:** Set all environment variables in your hosting platform

### 10. Testing Actual Notifications

To test receiving actual notifications, you'll need to:

1. Set up a backend service to send push notifications (using web-push library)
2. Schedule notifications based on user check-ins
3. Trigger test notifications to verify the full flow

Example backend code (Node.js):
```javascript
const webpush = require('web-push')

webpush.setVapidDetails(
  'mailto:your-email@example.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
)

async function sendNotification(subscription, data) {
  try {
    await webpush.sendNotification(subscription, JSON.stringify(data))
    console.log('Notification sent successfully')
  } catch (error) {
    console.error('Error sending notification:', error)
  }
}
```

## Summary

The push notification system now includes:
- ✅ Comprehensive error handling
- ✅ Detailed logging for debugging
- ✅ User-friendly error messages
- ✅ Service worker readiness checks
- ✅ Authentication validation
- ✅ Database error handling
- ✅ Duplicate subscription handling
- ✅ Environment variable validation

If you encounter any issues, check the browser console first - all errors are logged with clear indicators.