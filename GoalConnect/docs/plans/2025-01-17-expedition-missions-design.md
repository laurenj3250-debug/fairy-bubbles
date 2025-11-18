# Expedition Missions: Gamified Mountain Unlocking System

**Design Date:** January 17, 2025
**Status:** Ready for Implementation

## Executive Summary

Expedition Missions is a gamified progression system that unlocks all 40 real-world mountains sequentially through time-based habit challenges. Each mountain's mission is authentically themed to match its real-world characteristics (elevation, difficulty, expedition duration, danger level), creating an engaging mountaineering journey that motivates consistent habit completion.

---

## Core Concept

Users progress through all 40 mountains in a linear sequence, unlocking them one at a time by completing time-based habit challenges. Only one mission is active at a time, creating focus and preventing overwhelm.

### Key Principles

1. **Linear Progression with Level Gates** - Mountains unlock sequentially but require specific climbing levels
2. **Authentic Mountain Theming** - Each mission reflects real expedition characteristics
3. **Time-Based Challenges** - All missions are based on consecutive days of habit completion
4. **Multi-Reward System** - Each summit provides background, theme, XP, points, badges, and potential feature unlocks
5. **Manual Restart on Failure** - Users control when to retry, making commitment intentional

---

## Progression System

### Linear Path with Level Gates

- Mountains unlock sequentially: #1 → #2 → #3 → ... → #40
- Only **one active mission** at a time
- Must meet the mountain's `required_climbing_level` to attempt its mission
- If you reach Mountain #15 (requires level 10) but you're only level 8, you must build your level through daily habits before attempting the mission
- Creates natural pacing and prevents hitting impossible walls

### Climbing Level Integration

Uses existing `player_climbing_stats` table:
- `climbing_level` increases through daily habit completion (existing XP system)
- Mountains have varying `required_climbing_level` (1-50+ in database)
- Creates meaningful loop: **habits → levels → unlock missions → complete missions → unlock mountains**

---

## Mission Design Formula

Each mountain's mission is calculated using a sophisticated formula combining multiple factors:

### 1. Base Duration (from real expedition length)

Real-world expedition durations scaled ~50% for habit tracking practicality:

- **Single-day climbs** (Mt. Fuji): 1-3 day missions
- **Week-long expeditions** (Mt. Rainier): 5-7 day missions
- **Multi-week climbs** (Denali): 14-21 day missions
- **Major expeditions** (Everest): 28-45 day missions

### 2. Difficulty Tier Multiplier

Applied to base duration:

- **Novice**: 0.8x (more forgiving)
- **Intermediate**: 1.0x (baseline)
- **Advanced**: 1.2x (longer commitment)
- **Expert**: 1.4x (serious dedication)
- **Elite**: 1.5x (maximum challenge)

### 3. Completion Requirements (varies by mountain)

Based on fatality rate and technical difficulty:

- **Easy mountains** (low fatality rate): Complete **75-80%** of habits each day
- **Moderate mountains**: Complete **85-90%** of habits each day
- **Dangerous mountains** (high fatality rate): Complete **100%** of habits each day
- **Perfect day variants**: Some mountains require X "perfect days" (100%) within Y total days

### Example Calculations

**Mount Fuji** (3,776m, Novice, 1-day real climb):
- Base: 3 days
- Tier: 0.8x = 2.4 → **3 days**
- Requirement: 75% of habits daily

**Mount Kilimanjaro** (5,895m, Novice, 5-7 day real climb):
- Base: 7 days
- Tier: 0.8x = 5.6 → **7 days**
- Requirement: 80% of habits daily

**Denali** (6,190m, Advanced, 14-21 day real expedition):
- Base: 18 days
- Tier: 1.2x = 21.6 → **21 days**
- Requirement: 90% of habits daily

**Mount Everest** (8,849m, Elite, 60+ day real expedition):
- Base: 30 days
- Tier: 1.5x = 45 → **45 days**
- Requirement: 100% of habits daily (perfection required)

---

## Multi-Reward System

When you successfully summit a mountain (complete its mission), you receive:

### 1. Mountain Background & Theme - Personal Summit Memory

- Unlock mountain's unique background image from `/backgrounds/{mountain}.png`
- Animated elements (snow on Everest, cherry blossoms on Fuji, northern lights on Denali)
- Custom color themes from `theme_colors` JSON
- **Personal touch**: Background shows YOUR summit date ("Summited: Dec 15, 2024")
- Mix and match backgrounds and themes separately
- Stored in `mountain_backgrounds` table with `is_active` flag

### 2. Summit Story & Celebration

- Immersive full-screen summit animation
- Personalized story: "After {X} days of dedication, you've reached the summit of {Mountain}!"
- Stats display: completion %, perfect days, streak maintained
- Confetti/fireworks in mountain's theme colors
- Optional share screen (screenshot-ready celebration)
- Logged in expedition history with personal notes

### 3. Climbing Experience & Level Progression

XP rewards scale with mountain difficulty:

- **Novice peaks**: 50-100 XP
- **Intermediate**: 150-300 XP
- **Advanced**: 400-700 XP
- **Expert**: 800-1200 XP
- **Elite** (8000m peaks): 1500-3000 XP

Updates `player_climbing_stats.total_experience` and may trigger level-ups.

Level-up unlocks new titles:
- Level 1-5: "Beginner"
- Level 6-15: "Alpine Climber"
- Level 16-30: "Mountaineer"
- Level 31-45: "Expeditioner"
- Level 46+: "Legend"

### 4. Adaptive Points & Rewards

Base points for completion, plus bonus multipliers:

**Base Points** (similar scaling to XP):
- Novice: 50-150 points
- Intermediate: 200-400 points
- Advanced: 500-800 points
- Expert: 900-1500 points
- Elite: 2000-4000 points

**Bonus Multipliers**:
- **Speed bonus**: Completed on first attempt (no restarts) = **+25%**
- **Perfection bonus**: 100% habit completion every day = **+50%**
- **Streak bonus**: No breaks in overall habit streak during mission = **+25%**
- **Legendary summit**: All bonuses combined = **2x total rewards!**

Updates `user_points` table for Alpine Shop purchases.

### 5. Achievement Badges - Collectible & Shareable

- Beautiful illustrated badge for each mountain (not just text)
- Rarity tiers by difficulty:
  - **Bronze**: Novice mountains
  - **Silver**: Intermediate mountains
  - **Gold**: Advanced mountains
  - **Platinum**: Expert mountains
  - **Diamond**: Elite mountains (8000m peaks)
- Badges show unique stats: fastest summit time, streak during climb, season summited
- Special meta-badges:
  - "First Summit" (Mountain #1)
  - "10 Peaks Club" (10 summits)
  - "Everest Summiteer" (Everest summit)
  - "World Traveler" (summited on all continents)
  - "Perfect Climber" (achieved all bonus multipliers on a summit)
- Badge wall showing completed + empty slots (gotta catch 'em all!)
- Stored in `player_climbing_stats.achievements` JSON array

### 6. Milestone Feature Unlocks - Surprise & Delight

Strategic mountains unlock new app features:

| Mountain | Feature Unlocked | Description |
|----------|-----------------|-------------|
| #3 | **Expedition Forecast** | AI predictions of success rate on upcoming missions based on recent habit patterns |
| #7 | **Route Variations** | Choose between 2-3 mission types for some mountains (e.g., "7 perfect days" vs "10 days at 90%") |
| #12 | **Climbing Partner** | Virtual companion that cheers you on, gives tips, reacts to your progress |
| #18 | **Weather System** | Some days are "storms" (harder) or "clear weather" (easier), adding variety |
| #25 | **Expedition Photos** | AI-generated summit photos of YOU on each mountain |
| #40 | **Infinity Mode** | Procedurally generated endless mountains with increasing difficulty + all features unlocked |

---

## User Experience & Interface

### Dashboard Widget - "Current Expedition"

Located prominently on main Dashboard:

**Widget Elements:**
- Mountain name and description
- Beautiful mountain illustration/silhouette
- Progress bar showing "Day X of Y" with percentage
- Today's status: "⭐ 3/4 habits complete"
- Streak indicator: "🔥 4 perfect days in a row"
- Goal reminder: "Complete 80% of habits each day to summit!"
- Rewards preview (icons/thumbnails)
- "View Full Expedition Details →" link

**Real-time updates:**
- Progress updates as habits are completed throughout the day
- Color changes: gray → yellow (in progress) → green (goal met)
- Micro-celebrations when daily goal achieved

### Expedition Missions Page - Full Details

Accessed from dashboard widget or main navigation.

**Section 1: Active Mission (Top of page)**

Shows:
- Large hero image of current mountain
- Mountain details: name, elevation, country, range, difficulty
- Descriptive flavor text about the mountain
- Mission briefing:
  - Duration (X days)
  - Daily goal (% or specific number of habits)
  - Start date and expected summit date
  - Current habits count
- Visual calendar grid showing completed/remaining days
- Each day shows habit completion count
- Status indicator: "ON TRACK ✓" or "⚠️ BEHIND"
- Rewards preview with expandable details
- "Abandon Mission" button (with confirmation)

**Section 2: Next Mountains (Preview)**

Shows upcoming 3-5 mountains as cards:
- Mountain photo/illustration
- Name and elevation
- "Next Up!" or "After #X" indicator
- Required level
- Lock state if level too low
- Teaser of mission details on hover

Progress indicator:
- "You need Level X to attempt [Mountain]"
- Current level and XP to next level shown

**Section 3: Summit Collection (Completed Mountains)**

Horizontal scrollable gallery of conquered peaks:
- Badge thumbnails
- Mountain name
- Summit date
- Click to view detailed summit stats/story
- "View All Summits →" button

---

## Mission Lifecycle & User Flow

### 1. Starting a New Mission

**"Begin Expedition" Screen:**

Elements:
- Large hero image of the mountain
- Mountain name, elevation, country, difficulty
- Personalized intro text connecting previous summit to this one
- Mission briefing box:
  - Duration
  - Daily goal (% or habit count)
  - Start and expected summit dates
  - Current habits listed
  - Specific requirement explained
- Rewards preview
- Warning: "Once started, you cannot pause. Missing daily goal will fail the mission."
- Buttons: [Cancel] [🏔️ START EXPEDITION]

**After clicking "Start Expedition":**
- Brief confetti animation
- "Expedition Started! Day 1 begins now" notification
- Mission appears on dashboard
- First day's progress starts counting

### 2. Daily Progress Updates

**Throughout each day:**
- Dashboard widget updates in real-time as habits completed
- Shows current completion: "⭐ 3/4 habits complete (75%)"
- Status warnings if behind: "⚠️ Need 1 more habit to meet today's goal!"

**When daily goal is met:**
- ✅ Checkmark animation
- "DAY X COMPLETE!" notification
- Encouraging message: "3 more days to summit! Keep climbing! 🏔️"
- Small confetti effect
- Progress bar fills smoothly

**Progress milestones:**
- Halfway: "Halfway there! You're crushing it! 🎉"
- Final push: "Summit in sight! Just 2 more days!"
- Perfect streaks: "🔥 5 perfect days in a row! Legendary!"

### 3. Mission Failure

**When you miss a day's goal:**

Full-screen failure screen:
- Stormy/cloudy mountain image (same mountain, different mood)
- "⛈️ EXPEDITION FAILED"
- Mountain name
- "Expedition abandoned on Day X"
- Empathetic message: "The weather turned harsh. You completed only X/Y habits today (Z%), falling short of the required [goal]."
- Expedition summary:
  - Days attempted: X of Y
  - Perfect days: N
  - Overall completion: %
- Encouraging message: "Every mountaineer faces setbacks. The summit awaits your return when you're ready."
- Buttons: [View Stats] [🔄 RETRY EXPEDITION]

**After failure:**
- Mission status set to "failed" in database
- Stored in expedition history with full stats
- Dashboard shows "Retry [Mountain]?" prompt
- No penalty to points/XP/level
- Same mountain still "next" - must retry to progress

### 4. Mission Success - THE BIG MOMENT!

**When final day's goal is met:**

**Step 1: Summit Animation (Full Screen, 3 seconds)**
- Fade to full screen
- Animated climb visualization (🧗 → 🏔️)
- "✨ SUMMIT! ✨" appears
- Mountain name: "MOUNT KILIMANJARO"
- "CONQUERED!" text
- Confetti and celebration effects matching mountain's theme colors
- Optional: triumphant sound effect

**Step 2: Summit Story (Auto-advance after 3 seconds)**
- Beautiful summit photo with flag/climber
- Personalized story text:
  - "After X days of unwavering dedication, you've reached [unique mountain description]!"
  - "You completed X/Y possible habits (Z%) with N perfect days and an unbreakable spirit."
- "SUMMITED: [Date]" stamped prominently
- Button: [Continue to Rewards →]

**Step 3: Rewards Reveal (Animated sequence)**

Each reward animates in one by one (0.5s delay between):

1. ✅ **[Mountain] Background Unlocked!**
   - Preview thumbnail with "Summited: [Date]" watermark
2. ✅ **[Theme Name] Color Theme Unlocked!**
   - Color palette preview
3. ✅ **+[X] XP Earned!**
   - Animated counter
   - Level up notification if applicable: "Level 3 → Level 4 🎉"
4. ✅ **+[Y] Points!**
   - New total shown
5. ✅ **"[Badge Name]" Badge Earned!**
   - Shiny badge illustration with rarity glow
6. 💎 **BONUS** (if applicable):
   - Speed/Perfection/Streak bonuses displayed
   - Extra XP/points shown

Buttons:
- [Activate Theme Now] (applies background + theme immediately)
- [Continue] (return to dashboard)
- [Share Summit] (optional)

**Step 4: Return to Dashboard**
- Dashboard shows next mountain card: "Next: [Mountain]"
- Completed mountain badge added to summit collection
- Level up effects if applicable
- New theme available in Settings

**Optional: Share Screen**
- Screenshot-optimized graphic:
  - Mountain name and summit date
  - Mountain image with badge overlay
  - Mission stats (days, completion %)
  - GoalConnect branding
- Buttons: [Download Image] [Copy Link] [Close]

---

## Technical Implementation Overview

### Database Schema

**New Table: `expedition_missions`**

```sql
CREATE TABLE expedition_missions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mountain_id INTEGER NOT NULL REFERENCES mountains(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'completed', 'failed')),

  -- Mission parameters
  start_date TIMESTAMP NOT NULL DEFAULT NOW(),
  completion_date TIMESTAMP,
  total_days INTEGER NOT NULL,
  current_day INTEGER NOT NULL DEFAULT 1,
  required_completion_percent INTEGER NOT NULL, -- 75, 80, 90, 100

  -- Progress tracking
  days_completed INTEGER NOT NULL DEFAULT 0,
  perfect_days INTEGER NOT NULL DEFAULT 0,
  total_habits_completed INTEGER NOT NULL DEFAULT 0,
  total_habits_possible INTEGER NOT NULL DEFAULT 0,

  -- Rewards earned (for completed missions)
  xp_earned INTEGER DEFAULT 0,
  points_earned INTEGER DEFAULT 0,
  bonuses_earned TEXT DEFAULT '[]', -- JSON array of bonus types

  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_expedition_missions_user_id ON expedition_missions(user_id);
CREATE INDEX idx_expedition_missions_status ON expedition_missions(user_id, status);
CREATE UNIQUE INDEX idx_expedition_missions_active ON expedition_missions(user_id) WHERE status = 'active';
```

**Extend Existing Table: `player_climbing_stats`**

Add field:
```sql
ALTER TABLE player_climbing_stats
ADD COLUMN current_mountain_index INTEGER NOT NULL DEFAULT 1;
```

Tracks which mountain (1-40) the user is currently on.

**Extend Existing Table: `mountain_backgrounds`**

Add field:
```sql
ALTER TABLE mountain_backgrounds
ADD COLUMN summit_date TIMESTAMP NOT NULL DEFAULT NOW();
```

Records when user summited to display on background.

### API Endpoints

**GET `/api/expedition-missions/current`**
- Returns active mission for current user
- Includes mountain details, progress, requirements
- Returns `null` if no active mission

**GET `/api/expedition-missions/next`**
- Returns the next mountain to attempt
- Based on `current_mountain_index` from `player_climbing_stats`
- Includes level requirements and mission preview

**POST `/api/expedition-missions/start`**
- Body: `{ mountain_id: number }`
- Validates user level meets requirement
- Validates no active mission exists
- Creates new mission in `active` status
- Returns created mission

**POST `/api/expedition-missions/check-progress`**
- Called daily (can be automatic or manual)
- Checks today's habit completion against mission requirements
- Updates mission progress fields
- If failed: sets status to 'failed'
- If completed final day: triggers completion flow
- Returns updated mission with status

**POST `/api/expedition-missions/complete`**
- Called when final day is successfully completed
- Calculates rewards (XP, points, bonuses)
- Updates `player_climbing_stats` (XP, level, achievements)
- Creates `mountain_backgrounds` entry
- Awards points to `user_points`
- Increments `current_mountain_index`
- Sets mission status to 'completed'
- Returns rewards object

**POST `/api/expedition-missions/abandon`**
- Sets active mission to 'failed'
- Returns confirmation

**GET `/api/expedition-missions/history`**
- Returns all missions (completed + failed) for user
- Paginated, sorted by date desc
- Used for expedition journal/history view

**GET `/api/mountains/progression`**
- Returns all 40 mountains with unlock status:
  - Completed (with summit date)
  - Next (available to start)
  - Locked (level too low)
  - Future (not reached yet)

### React Components

**`<CurrentExpeditionWidget />`**
- Dashboard widget component
- Fetches `/api/expedition-missions/current`
- Real-time progress updates via habit completion
- Links to full expedition page

**`<ExpeditionMissionsPage />`**
- Full page view with 3 sections
- Active mission details
- Next mountains preview
- Summit collection

**`<BeginExpeditionModal />`**
- Modal/dialog for starting new mission
- Mission briefing and confirmation
- Calls `/api/expedition-missions/start`

**`<SummitCelebration />`**
- Multi-step celebration sequence
- Full-screen takeover
- Animates rewards reveal
- Optional share functionality

**`<MissionFailureModal />`**
- Shown when mission fails
- Displays stats and encouragement
- Retry button

**`<MountainProgressionGrid />`**
- Visual grid of all 40 mountains
- Shows locked/unlocked/completed states
- Tooltips with requirements

### Business Logic

**Mission Progress Checking (Daily)**

Pseudo-code:
```typescript
async function checkDailyProgress(userId: number, date: string) {
  const mission = await getActiveMission(userId);
  if (!mission) return;

  const userHabits = await getHabitsForUser(userId);
  const habitsCompleted = await getHabitsCompletedOnDate(userId, date);

  const completionPercent = (habitsCompleted.length / userHabits.length) * 100;
  const meetsGoal = completionPercent >= mission.required_completion_percent;

  if (meetsGoal) {
    mission.days_completed++;
    mission.current_day++;
    if (completionPercent === 100) mission.perfect_days++;

    if (mission.current_day > mission.total_days) {
      await completeMission(mission);
    }
  } else {
    await failMission(mission);
  }

  await updateMission(mission);
}
```

**Reward Calculation**

Pseudo-code:
```typescript
function calculateRewards(mission: ExpeditionMission, mountain: Mountain) {
  const baseXP = getBaseXP(mountain.difficultyTier);
  const basePoints = getBasePoints(mountain.difficultyTier);

  let xpMultiplier = 1.0;
  let pointsMultiplier = 1.0;
  const bonuses = [];

  // Speed bonus (first attempt)
  const previousAttempts = countPreviousAttempts(mission.user_id, mission.mountain_id);
  if (previousAttempts === 0) {
    xpMultiplier += 0.25;
    pointsMultiplier += 0.25;
    bonuses.push('speed');
  }

  // Perfection bonus (100% every day)
  if (mission.perfect_days === mission.total_days) {
    xpMultiplier += 0.50;
    pointsMultiplier += 0.50;
    bonuses.push('perfection');
  }

  // Streak bonus (no habit streak breaks during mission)
  const streakMaintained = checkStreakDuringMission(mission);
  if (streakMaintained) {
    xpMultiplier += 0.25;
    pointsMultiplier += 0.25;
    bonuses.push('streak');
  }

  return {
    xp: Math.floor(baseXP * xpMultiplier),
    points: Math.floor(basePoints * pointsMultiplier),
    bonuses
  };
}
```

---

## Implementation Priority

### Phase 1: Core System (MVP)
1. Database migrations (new table + field additions)
2. API endpoints for mission CRUD
3. Basic mission start/progress/complete flow
4. Dashboard widget showing current mission
5. Simple success/failure notifications

### Phase 2: Full UI/UX
1. Expedition Missions page with all sections
2. Begin Expedition modal with mission briefing
3. Summit celebration animation sequence
4. Mission failure modal
5. Mountain progression grid

### Phase 3: Rewards & Polish
1. Background/theme activation system
2. Badge gallery and achievement tracking
3. Bonus multiplier calculations
4. Share functionality
5. Mission history/journal view

### Phase 4: Advanced Features (Post-MVP)
1. Milestone feature unlocks (#3, #7, #12, etc.)
2. Route variations (choose mission type)
3. Climbing partner companion
4. Weather system variety
5. AI expedition photos
6. Infinity mode

---

## Success Metrics

### Engagement Metrics
- **Mission Start Rate**: % of users who start their next available mission within 7 days
- **Mission Completion Rate**: % of started missions that are successfully completed
- **Retry Rate**: % of failed missions that are retried within 30 days
- **Average Days to Summit**: Median days from mission start to completion

### Retention Metrics
- **7-Day Retention**: Users who return within 7 days of summiting
- **30-Day Retention**: Users still active 30 days after first summit
- **Mountain Milestone Retention**: Retention at key mountains (#10, #20, #30, #40)

### Progression Metrics
- **Average Mountains Summited**: Mean number of summits per user
- **Time to 10 Summits**: Median days from signup to 10th summit
- **Elite Climber Rate**: % of users who reach Mountain #40

### Feature Impact
- **Theme Activation Rate**: % of users who activate unlocked themes
- **Share Rate**: % of summits that are shared
- **Bonus Achievement Rate**: % of summits earning all 3 bonuses

---

## Open Questions & Future Considerations

### Questions to Validate
1. Should mission progress auto-check daily, or require user to manually "check in"?
2. Should there be a grace period (24 hours) to complete a missed day?
3. Should users be able to see all 40 mountains from the start, or discover them progressively?
4. Should there be seasonal/limited-time expedition events?

### Future Enhancements
1. **Team Expeditions**: Climb with friends, shared progress
2. **Expedition Seasons**: Quarterly challenges with exclusive rewards
3. **Dynamic Difficulty**: Adjust mission difficulty based on user's habit consistency
4. **Gear System Integration**: Require specific gear from Alpine Shop for harder mountains
5. **Weather Forecast**: See upcoming "storm days" in advance to plan
6. **Expedition Permits**: Unlock ability to attempt certain mountains through achievements

---

## Conclusion

Expedition Missions transforms habit tracking into an epic mountaineering journey. By combining authentic mountain theming, progressive difficulty, rich rewards, and celebratory moments, users are motivated to maintain consistent habits while experiencing a sense of real accomplishment.

The linear progression with level gates ensures users are always challenged but never overwhelmed. The multi-reward system provides both immediate gratification (themes, badges) and long-term goals (feature unlocks, prestige). The manual retry system respects user autonomy while maintaining challenge integrity.

This system leverages the existing 40-mountain database and creates a sustainable engagement loop that can retain users for months or years as they work toward conquering all peaks.

**Ready for implementation.**
