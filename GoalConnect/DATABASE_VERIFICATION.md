# Database Verification & Troubleshooting

## ✅ Quick Verification Steps

### 1. Check Database Connection
```bash
# Make sure DATABASE_URL is set in .env
cat .env | grep DATABASE_URL
```

### 2. Verify User Exists
Your user: **laurenj3250**  
Email: **laurenj3250@goalconnect.local**

### 3. Test Habit Toggle

When you click a habit, this is what happens:

```
Frontend (Dashboard.tsx)
  ↓ toggleHabitMutation.mutate({ habitId, completed })
  
POST /api/habit-logs/toggle
  ↓ server/routes.ts line 227
  
getUserId(req) → Returns your user ID
  ↓
  
Check for existing log in database
  ↓
  
IF exists:
  Toggle completed field (true ↔ false)
ELSE:
  Create new log with completed = true
  ↓
  
SAVE TO SUPABASE ✅
  ↓
  
Update pet stats
  ↓
  
Return response to frontend
```

## 🔍 How to Verify Your Data is Saving

### Option 1: Check Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **Table Editor**
4. Click on **habit_logs** table
5. You should see your completed habits!

### Option 2: Run a Query
In Supabase SQL Editor:
```sql
-- See all your habit logs
SELECT hl.*, h.title 
FROM habit_logs hl
JOIN habits h ON h.id = hl.habit_id
WHERE hl.user_id = 1
ORDER BY hl.date DESC;
```

### Option 3: Check via API
```bash
# Get all your habit logs for today
curl http://localhost:5000/api/habit-logs?date=2025-11-04
```

## 🐛 Troubleshooting

### Problem: Habits not saving
**Check:**
- [ ] DATABASE_URL is set in .env
- [ ] Database tables exist (run init if needed)
- [ ] User account exists in database
- [ ] No JavaScript errors in browser console

**Solution:**
```bash
# Re-initialize database if needed
curl http://localhost:5000/api/init-database
```

### Problem: Habits won't toggle/unclick
**Check:**
- [ ] UNIQUE constraint exists on habit_logs
- [ ] No duplicate logs in database
- [ ] Toggle endpoint exists in routes.ts

**Solution:**
```bash
# Run the constraint verification script
npm run db:verify
```

### Problem: Data not persisting across page reloads
**This should NOT happen** because:
- DbStorage is being used (not MemStorage)
- All data goes to Supabase
- Queries properly filter by userId

**If this happens:**
1. Check browser console for errors
2. Check network tab for failed API calls
3. Verify DATABASE_URL is correct
4. Check Supabase dashboard for connection issues

## 📊 Key Files

### Database Configuration
- `.env` - Contains DATABASE_URL
- `server/db.ts` - Database connection with Supabase optimization
- `server/storage.ts` - Chooses DbStorage when DATABASE_URL is set
- `server/db-storage.ts` - Implements all database operations

### Habit Toggle Logic
- `client/src/pages/Dashboard.tsx` - Line 97-155 (toggleHabitMutation)
- `server/routes.ts` - Line 227-297 (/api/habit-logs/toggle endpoint)

### Schema
- `shared/schema.ts` - Database schema with UNIQUE constraint

## 🎯 What Makes Your Habits Sticky

1. **userId Scoping**: Every habit log has your user ID (1)
2. **UNIQUE Constraint**: Prevents duplicate logs for same habit+user+date
3. **Foreign Keys**: Ensures data integrity
4. **DbStorage**: Real database persistence (not memory)
5. **Supabase**: Cloud database that persists across devices
6. **Proper Toggle Logic**: Updates existing logs instead of creating duplicates

## ✨ Your Data is Safe Because:

- ✅ Everything is tied to your user account
- ✅ Supabase automatically backs up your data
- ✅ Foreign keys prevent orphaned records
- ✅ Unique constraints prevent duplicates
- ✅ Serverless functions properly close connections
- ✅ SSL encryption protects data in transit

---

**Bottom Line:** Your habits WILL save and persist. The database is properly configured with Supabase, all operations are user-scoped, and the toggle endpoint correctly handles create/update logic with proper constraints to prevent duplicates.
