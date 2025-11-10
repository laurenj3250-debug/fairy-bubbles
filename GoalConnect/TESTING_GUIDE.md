# Mountain Habit App - Testing Guide

## 🚀 Getting Started

### Server Status
Your development server is running successfully on **http://localhost:5000**

```bash
✅ Server: Running on port 5000
✅ Database: PostgreSQL via Supabase (all migrations applied)
✅ Phase A: 100% complete (5/5 features)
✅ Dashboard: Complete redesign with climbing theme
✅ Phase B: 2/5 features implemented
```

---

## 🧪 Testing Phase A Gamification

### 1. Token Counter
**Location**: Top navigation bar (persistent)

**What to test**:
- [ ] Counter displays current token balance
- [ ] Clicking opens Alpine Shop
- [ ] Balance updates every 2 seconds
- [ ] Animated bounce effect on load
- [ ] Floating "+X" numbers appear when tokens are gained

**How to gain tokens**:
- Complete habits (10-50 tokens each based on difficulty)
- Claim daily quests
- Achieve streak milestones

---

### 2. Completion Celebration
**Location**: Triggers when you toggle a habit as complete

**What to test**:
- [ ] Response time <200ms from click to visual feedback
- [ ] Checkmark animation appears
- [ ] Particle burst effect (confetti-like)
- [ ] Gold toast notification shows
- [ ] Screen shake/vibration (on mobile)

**How to trigger**:
1. Go to dashboard (Today's Pitch section)
2. Click any habit checkbox to mark complete
3. Watch for celebration effects

---

### 3. Combo Tracker
**Location**: Bottom-right floating widget (only visible when active)

**What to test**:
- [ ] Widget appears after completing 2+ habits within 5 minutes
- [ ] Combo counter increases with each habit
- [ ] Multiplier shows (1.1x → 1.2x → 1.3x)
- [ ] Countdown timer displays time remaining
- [ ] Daily high score tracking works

**How to trigger**:
1. Complete a habit
2. Within 5 minutes, complete another habit
3. Combo widget should appear
4. Try to complete more habits quickly to increase combo

---

### 4. Daily Quests
**Location**: Dashboard, right sidebar (below Today's Pitch)

**What to test**:
- [ ] 3 quests display for today
- [ ] Progress bars update as you complete habits
- [ ] "Claim" button appears when quest is complete
- [ ] Token reward granted on claim
- [ ] Quest resets at midnight

**Quest types**:
- "Complete X habits today"
- "Complete X mind/training/foundation habits"

---

### 5. Streak Freeze
**Location**: Dashboard, right sidebar (below Daily Quests)

**What to test**:
- [ ] Shows current freeze inventory (0-3)
- [ ] Purchase button available (costs 100 tokens)
- [ ] Can't purchase if already have 3 freezes
- [ ] Earn 1 freeze automatically on 7-day streak
- [ ] Freezes protect streak if you miss a day

---

## 🏔️ Testing Dashboard Features

### Weather/Mood System
**Location**: Background of entire dashboard

**What to test**:
- [ ] Background changes based on your progress
- [ ] Clear sky = good streak
- [ ] Overcast = some missed days
- [ ] Storm = many missed days
- [ ] Parallax cloud layers move on scroll

---

### Basecamp Indicator
**Location**: Dashboard, right sidebar (bottom panel)

**What to test**:
- [ ] Icon changes: ⛺ (0%) → 🪵 (1-49%) → 🔥 (50%+)
- [ ] Glow intensity increases with progress
- [ ] Shows today's completion percentage
- [ ] Smooth transitions between states

---

### Today's Pitch (Enhanced)
**Location**: Dashboard, main panel (left 62%)

**What to test**:
- [ ] Habits grouped by category (Training, Mind, Foundation, Adventure)
- [ ] Large tap targets (ADHD-friendly)
- [ ] Optimistic UI (instant visual feedback on toggle)
- [ ] Empty state shows climbing microcopy
- [ ] Category badges color-coded

---

### Ridge Traverse (7-Day View)
**Location**: Dashboard, bottom row (full width)

**What to test**:
- [ ] Shows 7 days at a glance
- [ ] Peak heights vary by completion percentage
- [ ] Can click peaks to switch days
- [ ] Selected day highlighted
- [ ] Season progress overlay shows total days

---

## 🐛 Known Issues & How to Report

### If Habit Creation Fails

**Steps to debug**:
1. Open browser Developer Console (F12 or Cmd+Option+I)
2. Go to "Console" tab
3. Try to create a habit
4. Copy any red error messages
5. Share the error with the full stack trace

**Common issues**:
- Authentication error → Try logging out and back in
- Network error → Check if server is running on :5000
- Validation error → Check all required fields are filled

---

### If Dashboard Looks Empty

**Reason**: You need habits to see most features!

**Solution**:
1. Click "+ Add Habit" button (bottom-left pill)
2. OR use quick route templates in habit creation dialog
3. Create at least 3-5 habits to see dashboard populate

**Quick habits to create**:
- Morning Stretch (Mind, Daily, Light)
- Gym Training (Training, Weekly 3x, Heavy)
- Read (Mind, Daily, Light)
- Walk Outside (Foundation, Daily, Light)
- Meditate (Mind, Daily, Light)

---

## 🎯 Testing Workflow

### Recommended Test Sequence:

**Day 1: Setup**
1. ✅ Create 5 habits using templates
2. ✅ Mark 2-3 habits complete
3. ✅ Check completion celebration triggers
4. ✅ Verify token counter updates
5. ✅ Check daily quests appear

**Day 2: Combos**
1. ✅ Complete 2 habits within 5 minutes
2. ✅ Watch combo tracker appear
3. ✅ Try to increase combo to 3-5
4. ✅ Note daily high score

**Day 3: Quests**
1. ✅ Check quest progress bars
2. ✅ Complete a quest
3. ✅ Claim reward
4. ✅ Verify tokens added

**Day 4: Streaks**
1. ✅ Build 7-day streak
2. ✅ Earn auto streak freeze
3. ✅ Test purchasing freeze (if you have 100 tokens)
4. ✅ Verify freeze inventory updates

**Day 7: Full Experience**
1. ✅ Weather should be "Clear" if good streak
2. ✅ Basecamp indicator should be 🔥
3. ✅ Ridge traverse shows all 7 days
4. ✅ Multiple quests claimed
5. ✅ Combo high scores set

---

## 📊 Performance Metrics to Track

### Response Times
- [ ] Habit toggle: <200ms
- [ ] Page load: <2s
- [ ] Token counter update: 2s intervals
- [ ] Combo tracker appearance: <500ms

### Animations
- [ ] No jank or stuttering
- [ ] Smooth 60fps scrolling
- [ ] Spring physics feel natural
- [ ] Particles don't lag on low-end devices

### UX
- [ ] All primary actions: 1 tap
- [ ] No hidden features
- [ ] Clear visual hierarchy
- [ ] Climbing microcopy feels authentic

---

## 🔧 Manual Testing Checklist

### Authentication
- [ ] Sign up new account
- [ ] Log in existing account
- [ ] Log out
- [ ] Session persists on refresh

### Habit Management
- [ ] Create habit (via dialog)
- [ ] Create habit (via quick template)
- [ ] Edit existing habit
- [ ] Delete habit
- [ ] Mark habit complete
- [ ] Unmark habit (undo)

### Dashboard
- [ ] Weather changes based on progress
- [ ] Basecamp indicator animates
- [ ] Today's Pitch shows correct habits
- [ ] Ridge Traverse clickable
- [ ] Quick actions pill works

### Navigation
- [ ] Bottom nav: Base Camp, Training, Expeditions, Routes, Journal
- [ ] All routes load without errors
- [ ] Back button works
- [ ] Deep links work

### Gamification
- [ ] Tokens earned on completion
- [ ] Combos trigger correctly
- [ ] Quests track progress
- [ ] Streak freeze purchasable
- [ ] Level-up modal (when implemented)

---

## 🆘 Getting Help

### If Something Breaks

**Provide**:
1. **Browser console errors** (F12 → Console tab)
2. **Network errors** (F12 → Network tab)
3. **Screenshot** of the issue
4. **Steps to reproduce**

**Example good bug report**:
```
Issue: Habit creation fails with validation error

Steps:
1. Clicked "+ Add Habit"
2. Selected "Morning Stretch" template
3. Clicked "Create Route"
4. Got error: "Validation failed: category is required"

Console error:
[Error] POST /api/habits 400 Bad Request
{ message: "category is required" }

Screenshot: [attached]
```

---

## 🎨 Phase B Features (Coming Soon)

### 1. Level-Up Modal ✅ (Implemented, needs backend)
- Full-screen celebration when you level up
- Shows new climbing grade
- Lists newly unlocked mountains
- Token reward display

### 2. Mountain Unlock Toast ✅ (Implemented, needs backend)
- Toast notification when mountain unlocks
- Shows mountain details (elevation, country, tier)
- "Plan Expedition" CTA

### 3. XP Tracking (Next)
- Earn XP for completing habits
- XP bar shows progress to next level
- Different habits give different XP amounts
- Level thresholds: 100 XP per level

### 4. Gear Collection (Pending)
- Collect alpine gear items
- Rarity tiers: Basic → Intermediate → Advanced → Elite
- Visual progress grid
- Unlock gear by leveling up

### 5. Weekly Summit Report (Pending)
- Delivered every Monday
- Shows last week's stats
- Routes sent (100% weekly completion)
- Encouragement message
- Email + in-app modal

---

## 💡 Tips for Best Experience

1. **Create habits you actually want to do** - The gamification works best when habits are meaningful
2. **Start small** - 3-5 habits max to avoid overwhelm
3. **Use quick templates** - Faster than custom creation
4. **Check in daily** - 30-90 second daily check-in is the target
5. **Watch for combos** - Completing habits quickly is rewarding
6. **Claim quests** - Free tokens for things you're already doing
7. **Protect your streak** - Buy a freeze before you need it

---

**Last Updated**: 2025-11-10
**Server**: localhost:5000
**Status**: Phase A Complete, Phase B In Progress

