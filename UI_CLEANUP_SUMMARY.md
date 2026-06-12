# UI Cleanup & Duplicate Prevention Summary

## Changes Implemented

### 1. Settings Page UI Cleanup ✅

**File:** `app/(app)/settings/page.js`

**Changes:**
- ✂️ **Removed** the "Enable Notifications" toggle switch (lines 486-546)
- 📝 **Updated** card title from "Notification Preferences" to "Notification Schedule"
- 📝 **Added** subtitle: "Configure when you'd like to receive check-in reminders"
- 🔄 **Changed** scheduling inputs to always be visible (removed conditional `{notificationPreferences.enabled && (...)}`
- 📝 **Updated** button text from "Save Preferences" to "Save Schedule"

**Result:**
- Settings page now focuses purely on scheduling configuration
- No confusion about enable/disable state
- Chat page remains the single source of truth for notification on/off

### 2. Fixed Auto-Detect Timezone Race Condition ✅

**File:** `app/(app)/settings/page.js`

**Problem:** Auto-detect timezone was running immediately on mount, potentially saving preferences before existing data was loaded from database.

**Solution:**
- Added `preferencesLoaded` state flag
- Auto-detect only runs AFTER preferences are loaded from database
- Only triggers if timezone is still the default 'UTC'
- Prevents unnecessary API calls and duplicate record creation

**Code:**
```javascript
const [preferencesLoaded, setPreferencesLoaded] = useState(false)

// Load preferences first
useEffect(() => {
  const checkAuth = async () => {
    // ... auth check
    await loadNotificationPreferences(session.user.id)
    setPreferencesLoaded(true) // Mark as loaded
  }
  checkAuth()
}, [])

// Auto-detect ONLY after load
useEffect(() => {
  if (preferencesLoaded && notificationPreferences.timezone === 'UTC') {
    const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (detectedTimezone && detectedTimezone !== 'UTC') {
      setNotificationPreferences(prev => ({
        ...prev,
        timezone: detectedTimezone
      }))
    }
  }
}, [preferencesLoaded])
```

### 3. Implemented Native Upsert in API ✅

**File:** `app/api/notification-preferences/route.js`

**Problem:** The code used a "check then update/insert" pattern which had a race condition window between the SELECT and the INSERT/UPDATE.

**Solution:** Replaced with Supabase's native `upsert()` method:

**Before (lines 144-235):**
```javascript
// Check if exists
const { data: existingPrefs } = await supabase
  .from('notification_preferences')
  .select('id')
  .eq('user_id', user.id)
  .single()

// Then update or insert
if (existingPrefs) {
  // update...
} else {
  // insert...
}
```

**After:**
```javascript
// Atomic upsert - no race condition
const { data: preferences, error } = await supabase
  .from('notification_preferences')
  .upsert({
    user_id: user.id,
    // ... all fields
  }, {
    onConflict: 'user_id',
    ignoreDuplicates: false
  })
  .select()
  .single()
```

**Benefits:**
- ✅ Atomic operation - no race condition
- ✅ Database handles conflict resolution
- ✅ Simpler, more maintainable code
- ✅ Fewer database round-trips

### 4. Added Unique Constraint Migration ✅

**File:** `supabase/migrations/20240613_add_unique_user_constraint.sql`

**Purpose:** Enforce uniqueness at the database level to prevent duplicates even if application logic fails.

**What it does:**
1. Removes any existing duplicate records (keeps most recent per user)
2. Adds unique constraint: `notification_preferences_user_id_key`
3. Verifies constraint was created successfully

**SQL:**
```sql
-- Clean up existing duplicates
DELETE FROM notification_preferences
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id) id
  FROM notification_preferences
  ORDER BY user_id, updated_at DESC NULLS LAST
);

-- Add unique constraint
ALTER TABLE notification_preferences 
ADD CONSTRAINT notification_preferences_user_id_key 
UNIQUE (user_id);
```

**To Run:**
Execute this migration in your Supabase SQL Editor or via your migration tool.

---

## Expected Behavior After Changes

### Settings Page
- ✅ Displays "Notification Schedule" card with scheduling inputs
- ✅ No enable/disable toggle (cleaner UI)
- ✅ Frequency selector: Daily / Weekly / Monthly
- ✅ Weekly: Day-of-week selector
- ✅ Monthly: Day-of-month dropdown
- ✅ Time picker (HH:MM format)
- ✅ Timezone selector (auto-detected on first use)
- ✅ "Save Schedule" button updates existing record

### Chat Page
- ✅ "Enable Alerts" / "Disable Alerts" button (single source of truth)
- ✅ Button triggers push subscription AND updates database
- ✅ Updates existing record via upsert (no duplicates)

### Database
- ✅ **ONE record per user** in `notification_preferences` table
- ✅ Unique constraint prevents duplicates at DB level
- ✅ Upsert prevents race conditions at application level
- ✅ Safe concurrent access from multiple devices/tabs

---

## Testing Checklist

### Test 1: No Duplicates on Login
1. ✅ Log in to the app
2. ✅ Check database: `SELECT * FROM notification_preferences WHERE user_id = 'your-id'`
3. ✅ Expected: Exactly ONE record

### Test 2: Settings Page Scheduling
1. ✅ Navigate to Settings
2. ✅ Verify no enable/disable toggle visible
3. ✅ Change frequency to "Weekly"
4. ✅ Select specific days (e.g., Mon, Wed, Fri)
5. ✅ Set time to 10:00 AM
6. ✅ Change timezone to your location
7. ✅ Click "Save Schedule"
8. ✅ Check database: Record updated, no duplicate created

### Test 3: Chat Page Toggle
1. ✅ Navigate to Chat page
2. ✅ Click "Enable Alerts" or "Disable Alerts"
3. ✅ Verify toggle works
4. ✅ Check database: Same record updated, enabled field changed
5. ✅ No duplicate record created

### Test 4: Concurrent Updates
1. ✅ Open app in two browser tabs
2. ✅ In Tab 1: Update schedule settings
3. ✅ In Tab 2: Toggle notifications on/off
4. ✅ Check database: Still only ONE record
5. ✅ Most recent update wins (expected behavior)

### Test 5: Auto-Detect Timezone
1. ✅ Create new user account
2. ✅ Navigate to Settings
3. ✅ Verify timezone auto-detected (not UTC unless you're in UTC)
4. ✅ Change timezone manually
5. ✅ Save settings
6. ✅ Reload page - manual timezone persists (auto-detect doesn't override)

---

## Migration Instructions

### For Existing Database:

1. **Run the Migration:**
   ```sql
   -- In Supabase SQL Editor, run:
   -- supabase/migrations/20240613_add_unique_user_constraint.sql
   ```

2. **Verify No Duplicates:**
   ```sql
   SELECT user_id, COUNT(*) as count
   FROM notification_preferences
   GROUP BY user_id
   HAVING COUNT(*) > 1;
   ```
   Expected: 0 rows (no duplicates)

3. **Verify Constraint Exists:**
   ```sql
   SELECT conname 
   FROM pg_constraint 
   WHERE conrelid = 'notification_preferences'::regclass;
   ```
   Expected: `notification_preferences_user_id_key` in results

### For New Deployments:
The migration will run automatically as part of your migration sequence.

---

## Benefits Summary

✅ **Cleaner UI** - Settings page focuses on scheduling, no redundant toggles
✅ **Single Source of Truth** - Chat page controls enable/disable
✅ **No Duplicates** - Database constraint + upsert prevents all duplicate scenarios
✅ **No Race Conditions** - Atomic upsert operations
✅ **Better UX** - Auto-detect timezone without interfering with user choices
✅ **Maintainable** - Simpler code, fewer edge cases
✅ **Scalable** - Works correctly with multiple devices/tabs

---

## Files Modified

1. ✏️ `app/(app)/settings/page.js` - Removed toggle, fixed auto-detect
2. ✏️ `app/api/notification-preferences/route.js` - Implemented upsert
3. 📄 `supabase/migrations/20240613_add_unique_user_constraint.sql` - Added DB constraint
4. 📄 `UI_CLEANUP_SUMMARY.md` - This documentation

## Related Documentation
- `TIMEZONE_FIX_SUMMARY.md` - Timezone handling implementation
- `NOTIFICATION_SYSTEM_GUIDE.md` - Complete notification system guide