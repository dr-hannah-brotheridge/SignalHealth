# Push Notification System Guide

## Overview

SignalHealth now has a complete push notification system with two components:
1. **Test Notification API** - Send manual test notifications
2. **Scheduled Check-in System** - Automatic health check-in notifications

---

## Part 1: Test Notification API

### Purpose
Send test notifications to verify push notifications are working correctly.

### Endpoint
```
POST /api/send-test-notification
```

### Request Body
```json
{
  "userId": "user-uuid-here",
  "title": "Custom Title (optional)",
  "body": "Custom message (optional)"
}
```

### Example Usage

#### Using cURL
```bash
curl -X POST https://your-domain.com/api/send-test-notification \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "4d80f5ca-0225-4a08-989c-b999a6f69e91",
    "title": "Test Alert",
    "body": "This is a test notification!"
  }'
```

#### Using JavaScript (Browser Console)
```javascript
const userId = '4d80f5ca-0225-4a08-989c-b999a6f69e91';

fetch('/api/send-test-notification', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId,
    title: 'Test Notification',
    body: 'Hello from SignalHealth!'
  })
})
.then(res => res.json())
.then(data => console.log(data))
.catch(err => console.error(err))
```

### Response
```json
{
  "message": "Sent 1 notification(s), 0 failed",
  "details": [
    {
      "success": true,
      "subscription": { ... }
    }
  ]
}
```

---

## Part 2: Scheduled Check-in System

### Purpose
Automatically send health check-in notifications to users based on their scheduled check-in times.

### How It Works

1. **Cron Job**: Runs daily at 9:00 AM (UTC)
2. **Checks Database**: Finds users with `next_check_in_at` <= now
3. **Sends Notifications**: Pushes notifications to subscribed users
4. **Updates Schedule**: Sets the next check-in date based on `check_in_interval_days`

### Database Requirements

The `conversations` table must have these columns:
- `next_check_in_at` (timestamptz) - When the next check-in is due
- `is_proactive` (boolean) - Whether to send proactive check-ins
- `check_in_interval_days` (int4) - Days between check-ins (default: 7)

### Configuration

#### Vercel Environment Variables

Add these to your Vercel project:

```
VAPID_PRIVATE_KEY=WcSCOtUHz6Q-rQdyNBgordiVyjw7203IqrhSy9umHSk
CRON_SECRET=your-random-secret-string-here
```

#### Generate CRON_SECRET
```bash
# Generate a random secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Cron Schedule

The job runs at **9:00 AM UTC daily**. To change this, edit `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/check-ins",
      "schedule": "0 9 * * *"  // Cron expression
    }
  ]
}
```

### Cron Expression Format
```
* * * * *
│ │ │ │ │
│ │ │ │ └─── Day of week (0-7, Sunday = 0 or 7)
│ │ │ └───── Month (1-12)
│ │ └─────── Day of month (1-31)
│ └───────── Hour (0-23)
└─────────── Minute (0-59)
```

### Common Schedules
- `0 9 * * *` - Daily at 9 AM
- `0 */6 * * *` - Every 6 hours
- `0 9 * * 1` - Every Monday at 9 AM
- `0 9 1 * *` - 1st of every month at 9 AM
- `0 9 * * 1,3,5` - Mon, Wed, Fri at 9 AM

---

## Part 3: Setup Instructions

### Step 1: Add Environment Variables to Vercel

Go to Vercel → Settings → Environment Variables and add:

```
VAPID_PRIVATE_KEY=WcSCOtUHz6Q-rQdyNBgordiVyjw7203IqrhSy9umHSk
CRON_SECRET=your-generated-secret-here
```

### Step 2: Deploy to Vercel

```bash
git add .
git commit -m "Add push notification system"
git push
```

Vercel will automatically deploy and configure the cron job.

### Step 3: Test the System

#### Test Manual Notification
```bash
curl -X POST https://your-vercel-app.com/api/send-test-notification \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "your-user-id",
    "title": "Test",
    "body": "Testing notifications!"
  }'
```

#### Test Cron Job (Manual Trigger)
```bash
curl https://your-vercel-app.com/api/check-ins \
  -H "Authorization: Bearer your-cron-secret"
```

---

## Part 4: Monitoring

### Check Cron Job Logs

1. Go to Vercel Dashboard
2. Click your project
3. Go to "Deployments" tab
4. Click on a deployment
5. View "Build Logs" or "Function Logs"

### Expected Logs

```
🔄 Starting check-in notification job...
📋 Found 3 conversations needing check-ins
✅ Sent notification to user 4d80f5ca-0225-4a08-989c-b999a6f69e91
✅ Sent notification to user abc123...
✅ Sent notification to user def456...
✅ Job complete: 3 sent, 0 failed
```

---

## Part 5: Troubleshooting

### Notifications Not Sending

1. **Check Environment Variables**
   - Verify `VAPID_PRIVATE_KEY` is set in Vercel
   - Verify `CRON_SECRET` is set in Vercel

2. **Check User Subscriptions**
   ```sql
   SELECT * FROM push_subscriptions WHERE user_id = 'your-user-id';
   ```

3. **Check Conversation Settings**
   ```sql
   SELECT user_id, next_check_in_at, is_proactive, check_in_interval_days
   FROM conversations
   WHERE user_id = 'your-user-id';
   ```

4. **Check Cron Job Status**
   - Go to Vercel → Deployments → Latest deployment
   - Look for cron job logs

### Cron Job Not Running

1. **Verify `vercel.json` is in project root**
2. **Check cron schedule format is correct**
3. **Ensure deployment has completed**
4. **Check Vercel project has cron jobs enabled**

### 401 Unauthorized Error

- Verify `CRON_SECRET` matches between Vercel and your request
- Check Authorization header format: `Bearer your-secret`

---

## Part 6: Customization

### Change Notification Message

Edit `app/api/check-ins/route.js`:

```javascript
await webpush.sendNotification(subscription, JSON.stringify({
  title: '💚 Health Check-in',
  body: "It's time for your health check-in! How are you feeling today?",
  icon: '/icon.png',
  badge: '/icon.png',
  url: '/chat'
}))
```

### Change Check-in Schedule

Edit `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/check-ins",
      "schedule": "0 12 * * *"  // Change to 12 PM
    }
  ]
}
```

### Add Multiple Cron Jobs

```json
{
  "crons": [
    {
      "path": "/api/check-ins",
      "schedule": "0 9 * * *"
    },
    {
      "path": "/api/check-ins",
      "schedule": "0 18 * * *"
    }
  ]
}
```

---

## Part 7: Security Notes

### Important Security Practices

1. **Never expose `VAPID_PRIVATE_KEY`** in client-side code
2. **Keep `CRON_SECRET` secret** - don't commit to git
3. **Use HTTPS** for all production deployments
4. **Validate user IDs** before sending notifications
5. **Rate limit** the test API if needed

### Environment Variables Summary

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | ✅ | Public VAPID key (client) |
| `VAPID_PRIVATE_KEY` | ✅ | Private VAPID key (server) |
| `SUPABASE_SERVICE_KEY` | ✅ | Supabase admin key |
| `CRON_SECRET` | ✅ | Secret for cron job authentication |

---

## Part 8: Next Steps

### Recommended Enhancements

1. **Add notification preferences** - Let users opt out
2. **Customize notification times** - Per-user scheduling
3. **Add notification history** - Track sent notifications
4. **Implement retry logic** - Handle failed sends
5. **Add analytics** - Track notification engagement
6. **Support multiple devices** - Handle multiple subscriptions per user

### Database Enhancements

```sql
-- Add notification preferences table
CREATE TABLE notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  enabled BOOLEAN DEFAULT true,
  check_in_time TIME DEFAULT '09:00',
  timezone VARCHAR(50) DEFAULT 'UTC',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add notification history table
CREATE TABLE notification_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  type VARCHAR(50),
  title TEXT,
  body TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(20)
);
```

---

## Support

For issues or questions:
1. Check browser console for errors
2. Check Vercel deployment logs
3. Verify all environment variables are set
4. Check Supabase database permissions