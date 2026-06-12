# Supabase Cron Setup Guide

## Overview
We're using Supabase's built-in pg_cron to trigger notification checks every 15 minutes. This works around Vercel's Hobby plan limitation (daily cron only).

---

## Setup Steps

### 1. Enable pg_cron in Supabase

**Go to Supabase Dashboard:**
1. Open your project: https://supabase.com/dashboard/project/YOUR_PROJECT_ID
2. Click **"Database"** in left sidebar
3. Click **"Extensions"** tab
4. Search for **"pg_cron"**
5. Click **"Enable"** if not already enabled

---

### 2. Enable HTTP Extension (Required for API Calls)

Still in Extensions tab:
1. Search for **"pg_net"** or **"http"**
2. Click **"Enable"**

This allows Supabase to make HTTP requests to your Vercel API.

---

### 3. Add CRON_SECRET to Vercel Environment Variables

**Generate a secret:**
```bash
# Run this in your terminal to generate a secure random string
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Add to Vercel:**
1. Go to: https://vercel.com/dashboard
2. Select your **SignalHealth** project
3. Go to **Settings** → **Environment Variables**
4. Click **"Add New"**
5. Name: `CRON_SECRET`
6. Value: Paste the generated secret
7. Select **"Production"**, **"Preview"**, and **"Development"**
8. Click **"Save"**

**Also add to local `.env.local`:**
```bash
CRON_SECRET=your_generated_secret_here
```

---

### 4. Update Migration File with Your Vercel URL

Edit `supabase/migrations/20240612_setup_notification_cron.sql`:

**Line 21:** Replace `https://your-app.vercel.app` with your actual Vercel URL:
```sql
'https://signal-health-xyz123.vercel.app/api/check-ins',
```

**Line 22:** Replace `YOUR_CRON_SECRET` with the secret you generated:
```sql
ARRAY[http_header('Authorization', 'Bearer actual_secret_here')],
```

---

### 5. Run the Migration

**Option A: Via Supabase Dashboard (Easiest)**

1. Go to **SQL Editor** in Supabase Dashboard
2. Copy the entire contents of `supabase/migrations/20240612_setup_notification_cron.sql`
3. Paste into SQL Editor
4. Update the URL and secret (lines 21-22)
5. Click **"Run"**

**Option B: Via CLI**

```bash
# Install Supabase CLI if not installed
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Run migrations
supabase db push
```

---

### 6. Verify Cron Job is Running

**Run this query in Supabase SQL Editor:**

```sql
-- View all cron jobs
SELECT * FROM cron.job;

-- View cron job run history
SELECT 
  jobid,
  runid,
  job_pid,
  database,
  username,
  command,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 10;
```

**Expected output:**
- Should see job named `'check-notifications'`
- Schedule: `*/15 * * * *`
- Status: Active

---

## How It Works

### Architecture:

```
┌─────────────────┐
│   Supabase      │
│   Database      │
│                 │
│  pg_cron runs   │
│  every 15 min   │
└────────┬────────┘
         │
         │ HTTP GET with Authorization header
         │
         ▼
┌─────────────────┐
│   Vercel API    │
│                 │
│  /api/check-ins │
│                 │
│  1. Verifies    │
│     CRON_SECRET │
│  2. Queries DB  │
│  3. Sends push  │
│     notifications│
└─────────────────┘
```

### Flow:

1. **Every 15 minutes**, Supabase pg_cron triggers
2. Calls `trigger_notification_check()` function
3. Function makes HTTP GET to Vercel `/api/check-ins`
4. Includes `Authorization: Bearer CRON_SECRET` header
5. Vercel endpoint verifies secret
6. Checks for due notifications
7. Sends push notifications to users
8. Updates `next_check_in_at` timestamps

---

## Testing

### Test the Cron Job Manually:

**Run this in Supabase SQL Editor:**

```sql
-- Manually trigger the notification check
SELECT trigger_notification_check();

-- Check if it ran successfully
SELECT * FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 1;
```

### Test a Real Notification:

1. Set a notification for 2 minutes from now
2. Wait 15 minutes (for next cron run)
3. Should receive notification

---

## Monitoring

### Check Cron Job Status:

```sql
-- See recent runs
SELECT 
  jobid,
  status,
  return_message,
  start_time
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'check-notifications')
ORDER BY start_time DESC
LIMIT 20;
```

### Check Notification Preferences:

```sql
-- See who is due for notifications
SELECT 
  user_id,
  enabled,
  frequency,
  time,
  timezone,
  next_check_in_at,
  next_check_in_at < NOW() as is_due
FROM notification_preferences
WHERE enabled = true
ORDER BY next_check_in_at;
```

---

## Troubleshooting

### Cron Job Not Running:

1. **Check extension enabled:**
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'pg_cron';
   ```

2. **Check job exists:**
   ```sql
   SELECT * FROM cron.job;
   ```

3. **Manual trigger:**
   ```sql
   SELECT trigger_notification_check();
   ```

### HTTP Requests Failing:

1. **Check http extension:**
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'http';
   ```
   If not found: `CREATE EXTENSION http;`

2. **Check Vercel URL is correct** (no typos)

3. **Check CRON_SECRET matches** between Supabase and Vercel

### Notifications Not Sending:

1. Check Vercel logs:
   - Vercel Dashboard → Your Project → Deployments → Latest → Logs

2. Check API response:
   ```sql
   SELECT trigger_notification_check();
   -- Look at return_message
   ```

3. Verify endpoint manually:
   ```bash
   curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
        https://your-app.vercel.app/api/check-ins
   ```

---

## Disabling/Modifying Cron

### Disable the Cron Job:

```sql
-- Find the job ID
SELECT jobid, jobname FROM cron.job;

-- Unschedule it
SELECT cron.unschedule(jobid) 
FROM cron.job 
WHERE jobname = 'check-notifications';
```

### Change Schedule:

```sql
-- Change to hourly
SELECT cron.schedule(
  'check-notifications',
  '0 * * * *',  -- Every hour
  'SELECT trigger_notification_check();'
);

-- Change to every 5 minutes
SELECT cron.schedule(
  'check-notifications',
  '*/5 * * * *',  -- Every 5 minutes
  'SELECT trigger_notification_check();'
);
```

---

## Cost & Limits

### Supabase Free Tier:
- ✅ pg_cron included
- ✅ Unlimited cron jobs
- ✅ Can run every minute if needed
- ⚠️ Database connection limits apply (pooling recommended)

### Vercel Hobby Tier:
- ✅ API endpoints unlimited
- ✅ No cron frequency limits when called externally
- ⚠️ Function execution time: 10 seconds max
- ⚠️ Serverless function invocations: 100GB-hours/month

---

## Security Notes

1. **CRON_SECRET** - Never commit to git, use environment variables only
2. **Service Role Key** - Already secured in environment variables
3. **Rate Limiting** - Consider adding if needed (pg_cron runs predictably)
4. **HTTPS Only** - Always use https:// for Vercel URL

---

## Next Steps

After setup:
1. ✅ Deploy updated code to Vercel
2. ✅ Add CRON_SECRET to Vercel environment variables
3. ✅ Run Supabase migration
4. ✅ Test with a notification 20 minutes from now
5. ✅ Monitor cron job runs in Supabase

---

## Alternative: Supabase Edge Function (Future Enhancement)

If you want to keep everything in Supabase:

**Pros:**
- All logic in one place
- No Vercel API calls needed
- Potentially faster

**Cons:**
- Requires rewriting notification logic in Deno/TypeScript
- More complex setup

Let me know if you want to implement this later!

---

Last Updated: June 12, 2026