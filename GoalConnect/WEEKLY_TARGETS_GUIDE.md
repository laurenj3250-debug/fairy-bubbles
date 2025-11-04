# Weekly Targets Feature - Complete Guide

## ✅ Feature Status: FULLY WORKING

The ability to set a habit to "X times per week" is **100% functional**.

---

## How to Use Weekly Targets

### Creating a Habit with Weekly Target

1. **Click FAB (+) button** → "Start a new habit"
2. **Fill in basic info:**
   - Title: "Go to Gym"
   - Description: "Strength training or cardio"
   - Icon: Select "Dumbbell"
   - Color: Choose your favorite

3. **Set Cadence to "Weekly"** ← Important!
4. **Weekly Target dropdown appears** ✨
   - Select "3 times per week" (or 1-7)
   - Or leave as "No target" if you don't want tracking

5. **Save** → Habit created!

---

## What You'll See

### On Habits Page
```
┌─────────────────────────────────┐
│ 🏋️ Go to Gym                    │
│                                 │
│ [✓] Completed today             │
│ Streak: 5 days 🔥               │
│ Cadence: Weekly                 │
│ This Week: 2/3 ⬅️ YOUR PROGRESS  │
│ Total: 12 completions           │
└─────────────────────────────────┘
```

### On Dashboard
The habit appears in "Today's Habits" with checkbox to complete.

### On Planner (Weekly View)
```
🏋️ Go to Gym
2/3 completed ✓
Mon [✓] Tue [ ] Wed [✓] Thu [ ] Fri [ ] Sat [ ] Sun [ ]
```

---

## Visual Indicators

### Target Progress Colors
- **Green text** when target met: `3/3 completed ✓`
- **Grey text** when in progress: `2/3 completed`
- **Turns green** at exactly the target number

### Week Resets
- Week starts: **Monday**
- Week ends: **Sunday**
- Counter resets every Monday morning

---

## Technical Details

### What Was Fixed
1. ✅ **Blank Screen Issue** - Added null safety with `??` operator
2. ✅ **Database Storage** - `target_per_week` column exists
3. ✅ **UI Display** - Shows "X/Y completed" with color coding
4. ✅ **Week Calculation** - Properly counts Mon-Sun completions

### Files Involved
- `HabitDialog.tsx` - Weekly target selector (lines 206-237)
- `Habits.tsx` - Display target progress (lines 240-249)
- `Planner.tsx` - Weekly view with targets (lines 271, 288-295)
- `schema.ts` - Database field `targetPerWeek`

---

## Examples

### Daily Habit (No Weekly Target)
```
Cadence: Daily
No "This Week" counter shown
```

### Weekly Habit (No Target Set)
```
Cadence: Weekly
Weekly Target: Not set
Shows completions but no goal
```

### Weekly Habit (Target: 3/week)
```
Cadence: Weekly
This Week: 2/3
Color: Grey (not met yet)
```

### Weekly Habit (Target Met!)
```
Cadence: Weekly
This Week: 3/3 ✓
Color: Green (target achieved!)
```

---

## Use Cases

### Flexible Habits
```
"Piano Practice"
Cadence: Weekly
Target: 3 times/week
→ Any 3 days works!
```

### Gym Routine
```
"Gym Session"
Cadence: Weekly  
Target: 4 times/week
→ Track your fitness goals
```

### Language Learning
```
"Duolingo Practice"
Cadence: Weekly
Target: 5 times/week
→ Stay consistent
```

---

## FAQ

**Q: Can I change the target later?**  
A: Yes! Click Edit (pencil icon) → Change target → Save

**Q: What if I select "Daily" cadence?**  
A: Weekly target option is hidden (only for weekly habits)

**Q: Does it save to the database?**  
A: Yes! Stored in `habits.target_per_week` column in Supabase

**Q: What happens if I don't set a target?**  
A: The "This Week: X/Y" section won't appear. Habit still works normally.

**Q: Can I have different targets for different habits?**  
A: Yes! Each habit has its own independent target.

---

## Known Working Features ✅

✅ Create habit with weekly target  
✅ Edit habit to add/change/remove target  
✅ Display current week progress  
✅ Color coding (green when met)  
✅ Week counter (Mon-Sun)  
✅ Saves to Supabase database  
✅ No blank screen errors  
✅ Works on Dashboard, Habits, and Planner pages  

---

## Summary

**The weekly target feature is FULLY FUNCTIONAL!** 🎉

- Select "Weekly" cadence when creating a habit
- Choose 1-7 times per week (or no target)
- Track your progress with "X/Y completed"
- Green checkmark when you hit your goal
- All data saves to Supabase

**Everything works perfectly now!**
