# GoalConnect UI/UX Redesign Plan
**Date:** January 18, 2025
**Goal:** Transform from fragmented dashboard into cohesive mountaineering habit tracker

---

## 🎯 Design Principles

1. **Daily Action First** - Users should immediately see what to do TODAY
2. **Mountaineering Metaphor All The Way** - Every element reinforces the climbing theme
3. **Information Density** - Show meaningful data, hide decoration
4. **Semantic Color** - Colors indicate difficulty/urgency, not random prettiness
5. **Clear Win States** - Users always know what "success" looks like

---

## PHASE 1: INFORMATION ARCHITECTURE (Week 1)

### 1.1 Consolidate 9 Pages → 4 Core Views

#### 🏔️ **BASE CAMP** (Home/Today)
**Purpose:** Answer "What do I need to do RIGHT NOW?"

**Consolidates:**
- WeeklyHub.tsx
- DashboardNew.tsx
- DailyFocusHero component
- Todos (as "Today's Objectives" section)

**Layout:**
```
┌─────────────────────────────────────┐
│  Current Mountain Header             │
│  El Capitan • 2,307m                │
│  Energy: 85/100  Streak: 12 days    │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  TODAY'S ROUTE              2/6     │
│                                      │
│  ✓ Morning Meditation (5.6 Easy)    │
│  ✓ Hydration (5.4 Easy)             │
│  ○ Gym Session (5.9 Moderate)       │
│  ○ Read 30min (5.8 Moderate)        │
│  ○ Deep Work 2hr (5.11c Hard)       │
│  ○ Guitar (5.10d Hard)              │
│                                      │
│  🏔️ SUMMIT TODAY'S ROUTE            │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  THIS WEEK'S PROGRESS               │
│  Mind: ████░░░ 4/7                  │
│  Foundation: ███████ 7/7 ✓          │
│  Adventure: ██░░░░░ 2/7              │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  TODAY'S OBJECTIVES                 │
│  □ Review quarterly goals            │
│  □ Call mom                          │
│  □ Buy climbing shoes                │
└─────────────────────────────────────┘
```

#### 📖 **LOGBOOK**
**Purpose:** See past performance, patterns, achievements

**Consolidates:**
- HabitsMountain.tsx
- Stats/analytics pages
- Streak tracking

**Features:**
- Heatmap calendar (like GitHub contributions)
- Habit-by-habit analytics
- Achievements/milestones
- Climbing grade progression chart
- Weekly/monthly trends

#### 🗺️ **EXPEDITION PLANNER**
**Purpose:** Plan future goals and expeditions

**Consolidates:**
- Goals.tsx
- ExpeditionMissions.tsx
- WorldMap.tsx
- DreamScrollMountain.tsx (as "Dream Peaks")

**Layout:**
```
┌─────────────────────────────────────┐
│  ACTIVE EXPEDITIONS                 │
│  ► El Capitan (Week 4/12)           │
│  ▷ Learn Spanish (Not started)      │
│  ▷ Marathon Training (Not started)  │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  WORLD MAP                          │
│  [Interactive map with mountains]   │
│  ✓ Unlocked  🔒 Locked              │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  DREAM PEAKS (Future Goals)         │
│  🎸 Master guitar                   │
│  🏃 Run ultramarathon                │
│  📚 Publish novel                    │
└─────────────────────────────────────┘
```

#### ⚙️ **GEAR LOCKER**
**Purpose:** Settings, customization, shop

**Consolidates:**
- Settings.tsx
- AlpineShop.tsx (as themes/backgrounds shop)

**Features:**
- Profile settings
- Theme/background selection
- Notification preferences
- Data export
- Account management

### 1.2 New Bottom Navigation

```
┌──────┬──────┬──────┬──────┐
│ 🏔️   │ 📖   │ 🗺️   │ ⚙️   │
│ Base │ Log  │ Plan │ Gear │
│ Camp │ book │ ner  │      │
└──────┴──────┴──────┴──────┘
```

**Files to delete:**
- Remove: Multiple dashboard files (keep only BaseCamp.tsx)
- Remove: Separate Todos.tsx
- Refactor: Merge AlpineShop into Settings

---

## PHASE 2: VISUAL DESIGN SYSTEM (Week 2)

### 2.1 Color System - Climbing Difficulty Grades

**Replace:** Random gradient rotations
**With:** Semantic difficulty colors (YDS - Yosemite Decimal System)

```typescript
// New color system
export const DIFFICULTY_COLORS = {
  easy: {         // 5.0-5.6
    bg: '#4ade80',
    border: '#22c55e',
    text: '#166534'
  },
  moderate: {     // 5.7-5.9
    bg: '#fbbf24',
    border: '#f59e0b',
    text: '#92400e'
  },
  hard: {         // 5.10-5.11
    bg: '#fb923c',
    border: '#f97316',
    text: '#9a3412'
  },
  expert: {       // 5.12-5.13
    bg: '#ef4444',
    border: '#dc2626',
    text: '#991b1b'
  },
  elite: {        // 5.14+
    bg: '#000000',
    border: '#171717',
    text: '#fafafa'
  }
};

// Habits get assigned difficulty on creation
interface Habit {
  id: number;
  title: string;
  difficulty: 'easy' | 'moderate' | 'hard' | 'expert' | 'elite';
  grade: string; // e.g. "5.9", "5.11c"
  // ... other fields
}
```

### 2.2 Mountain Themes - Full Visual Transformation

**Current:** Just changes expedition name
**New:** Complete theme including colors, backgrounds, typography

#### El Capitan Theme (Warm Granite)
```css
:root[data-mountain="el-capitan"] {
  --granite-light: #f4e8d8;
  --granite-mid: #d4a574;
  --granite-dark: #8b6f47;
  --accent: #e8a661;
  --background: linear-gradient(135deg, #1a1410 0%, #2d1810 50%, #1a1410 100%);
  --card-bg: rgba(244, 232, 216, 0.03);
  --border: rgba(244, 232, 216, 0.1);
}
```

#### K2 Theme (Harsh Ice)
```css
:root[data-mountain="k2"] {
  --ice-light: #e0f2fe;
  --ice-mid: #7dd3fc;
  --ice-dark: #0369a1;
  --accent: #38bdf8;
  --background: linear-gradient(135deg, #0c1218 0%, #1e293b 50%, #0c1218 100%);
  --card-bg: rgba(224, 242, 254, 0.03);
  --border: rgba(224, 242, 254, 0.1);
}
```

#### Denali Theme (Arctic)
```css
:root[data-mountain="denali"] {
  --snow-light: #f0f9ff;
  --snow-mid: #bae6fd;
  --snow-dark: #0284c7;
  --accent: #0ea5e9;
  --background: linear-gradient(135deg, #0a0e14 0%, #1a2332 50%, #0a0e14 100%);
  --card-bg: rgba(240, 249, 255, 0.03);
  --border: rgba(240, 249, 255, 0.1);
}
```

### 2.3 Component Redesign - ClimbingRouteView

**New Component:** `ClimbingRouteView.tsx`

```typescript
interface Pitch {
  id: number;
  habit: Habit;
  completed: boolean;
  streak: number;
}

export function ClimbingRouteView({ date }: { date: string }) {
  const pitches = useTodaysPitches(date);
  const completedCount = pitches.filter(p => p.completed).length;

  return (
    <div className="climbing-route">
      {/* Vertical rope line */}
      <div className="rope-line" />

      {/* Each habit is a "pitch" */}
      {pitches.map((pitch, index) => (
        <Pitch
          key={pitch.id}
          pitch={pitch}
          index={index}
          onClick={() => togglePitch(pitch.id)}
        />
      ))}

      {/* Summit goal */}
      <SummitGoal
        completed={completedCount === pitches.length}
        total={pitches.length}
      />
    </div>
  );
}
```

**Visual Structure:**
- Vertical layout (mimics climbing route)
- Rope line connecting all pitches
- Circular "holds" on left (filled when completed)
- Color-coded borders by difficulty
- Hover effects (slight translate)
- Completed items: strikethrough + opacity

---

## PHASE 3: COMPONENT IMPLEMENTATION (Week 3)

### 3.1 New Components to Create

```
components/
├── BaseCamp/
│   ├── MountainHeader.tsx         # Current mountain + stats
│   ├── ClimbingRouteView.tsx      # Main habit visualization
│   ├── Pitch.tsx                  # Individual habit item
│   ├── SummitGoal.tsx             # Completion celebration
│   ├── WeekProgress.tsx           # This week overview
│   └── TodaysObjectives.tsx       # Simple todo list
│
├── Logbook/
│   ├── HeatmapCalendar.tsx        # GitHub-style contribution grid
│   ├── HabitAnalytics.tsx         # Per-habit stats
│   ├── GradeProgression.tsx       # Climbing level over time
│   └── AchievementsList.tsx       # Milestones earned
│
├── Planner/
│   ├── ActiveExpeditions.tsx      # Current goals
│   ├── WorldMapView.tsx           # Mountain unlock map
│   ├── DreamPeaks.tsx             # Future goals (dream scroll)
│   └── ExpeditionDetail.tsx       # Mission details
│
└── shared/
    ├── ThemeProvider.tsx           # Mountain theme context
    ├── DifficultyBadge.tsx         # Color-coded grade display
    └── ProgressRing.tsx            # Circular progress indicator
```

### 3.2 Component Specifications

#### **MountainHeader.tsx**
```typescript
export function MountainHeader() {
  const { currentMountain, stats } = useMountainTheme();

  return (
    <header className="mountain-header">
      <Badge>🏔️ CURRENT EXPEDITION</Badge>
      <h1 className="mountain-name">{currentMountain.name}</h1>
      <p className="mountain-location">
        {currentMountain.location} • {currentMountain.elevation}m
      </p>

      <div className="stats-row">
        <Stat icon="⚡" label="Energy" value={`${stats.energy}/100`} />
        <Stat icon="🔥" label="Streak" value={`${stats.streak} days`} />
        <Stat icon="📊" label="Grade" value={stats.climbingGrade} />
        <Stat icon="🗓️" label="Week" value={`${stats.week}/12`} />
      </div>
    </header>
  );
}
```

#### **Pitch.tsx**
```typescript
interface PitchProps {
  pitch: {
    habit: Habit;
    completed: boolean;
    streak: number;
  };
  index: number;
  onClick: () => void;
}

export function Pitch({ pitch, index, onClick }: PitchProps) {
  const { habit, completed, streak } = pitch;
  const difficulty = DIFFICULTY_COLORS[habit.difficulty];

  return (
    <motion.div
      className={cn(
        "pitch",
        habit.difficulty,
        completed && "completed"
      )}
      style={{ borderLeftColor: difficulty.border }}
      onClick={onClick}
      whileHover={{ x: 4 }}
      layoutId={`pitch-${habit.id}`}
    >
      {/* Climbing hold indicator */}
      <div
        className="pitch-hold"
        style={{
          borderColor: difficulty.border,
          background: completed ? difficulty.bg : 'transparent'
        }}
      />

      <div className="pitch-content">
        <div className="pitch-info">
          <h3 className="pitch-name">
            {habit.icon} {habit.title}
          </h3>
          <div className="pitch-meta">
            <DifficultyBadge
              grade={habit.grade}
              color={difficulty.bg}
            />
            {streak > 0 && (
              <span className="streak-badge">
                🔥 {streak} day streak
              </span>
            )}
          </div>
        </div>

        {completed && (
          <CheckIcon size={28} color={difficulty.bg} />
        )}
      </div>
    </motion.div>
  );
}
```

#### **SummitGoal.tsx**
```typescript
export function SummitGoal({ completed, total }: { completed: number; total: number }) {
  const isComplete = completed === total;

  return (
    <motion.div
      className="summit"
      animate={isComplete ? { scale: [1, 1.05, 1] } : {}}
      transition={{ repeat: isComplete ? Infinity : 0, duration: 2 }}
    >
      <div className="summit-icon">
        {isComplete ? '🎉' : '🏔️'}
      </div>
      <div className="summit-text">
        {isComplete ? 'SUMMIT REACHED!' : 'SUMMIT TODAY\'S ROUTE'}
      </div>
      <p className="summit-subtitle">
        {isComplete
          ? `You crushed all ${total} pitches today!`
          : `Complete all ${total} pitches to send today's route`
        }
      </p>
    </motion.div>
  );
}
```

---

## PHASE 4: DATA & INTERACTIONS (Week 4)

### 4.1 Add Difficulty Field to Habits

**Migration:**
```sql
ALTER TABLE habits
ADD COLUMN difficulty VARCHAR(10) DEFAULT 'moderate',
ADD COLUMN grade VARCHAR(10) DEFAULT '5.8';

-- Update existing habits with reasonable defaults
UPDATE habits SET
  difficulty = 'easy',
  grade = '5.6'
WHERE category = 'foundation';

UPDATE habits SET
  difficulty = 'moderate',
  grade = '5.9'
WHERE category IN ('mind', 'training');

UPDATE habits SET
  difficulty = 'hard',
  grade = '5.10c'
WHERE category = 'adventure';
```

### 4.2 Theme System Hook

**useMountainTheme.ts (Enhanced)**
```typescript
export function useMountainTheme() {
  const { data: currentExpedition } = useQuery({
    queryKey: ['/api/expedition-missions/current']
  });

  const { data: mountain } = useQuery({
    queryKey: ['/api/mountains', currentExpedition?.mountainId],
    enabled: !!currentExpedition?.mountainId
  });

  useEffect(() => {
    if (mountain) {
      // Apply theme to document root
      document.documentElement.setAttribute(
        'data-mountain',
        mountain.name.toLowerCase().replace(/\s/g, '-')
      );

      // Update CSS custom properties
      const theme = MOUNTAIN_THEMES[mountain.id];
      Object.entries(theme.colors).forEach(([key, value]) => {
        document.documentElement.style.setProperty(`--${key}`, value);
      });
    }
  }, [mountain]);

  return {
    currentMountain: mountain,
    theme: MOUNTAIN_THEMES[mountain?.id] || MOUNTAIN_THEMES.default
  };
}
```

### 4.3 Celebration Animations

**When user completes all pitches:**
```typescript
const celebrateSummit = () => {
  // Confetti animation
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 }
  });

  // Toast notification
  toast({
    title: "🎉 SUMMIT REACHED!",
    description: "You've sent today's route. Take a moment to celebrate!",
    duration: 5000
  });

  // Award points/XP
  awardExpeditionProgress();
};
```

---

## PHASE 5: POLISH & MIGRATION (Week 5)

### 5.1 Route Cleanup

**Remove unused files:**
```bash
rm client/src/pages/DashboardNew.tsx
rm client/src/pages/Todos.tsx
rm client/src/pages/BeautifulDashboard.tsx
```

**Rename and consolidate:**
```bash
mv client/src/pages/WeeklyHub.tsx client/src/pages/BaseCamp.tsx
```

### 5.2 Update App.tsx Routing

```typescript
// New simplified routes
<Route path="/" component={BaseCamp} />
<Route path="/logbook" component={Logbook} />
<Route path="/planner" component={ExpeditionPlanner} />
<Route path="/gear" component={GearLocker} />
<Route path="/settings" component={GearLocker} /> {/* Alias */}
```

### 5.3 Migration Guide for Users

**Show one-time modal on first load:**
```
┌───────────────────────────────────┐
│  🏔️ Welcome to Base Camp!        │
│                                    │
│  We've redesigned GoalConnect to  │
│  make your daily climbing clearer.│
│                                    │
│  What's New:                       │
│  • Habits now shown as routes      │
│  • 4 main tabs (was 9 pages)       │
│  • Mountain themes are richer      │
│                                    │
│  All your data is safe!            │
│                                    │
│  [Take a Tour] [Got it, let's go]  │
└───────────────────────────────────┘
```

---

## SUCCESS METRICS

### Before Redesign:
- ❌ 9 separate pages (confusing navigation)
- ❌ Unclear what to do each day
- ❌ Glowing orbs with no labels
- ❌ Theme system barely visible
- ❌ No difficulty indicators

### After Redesign:
- ✅ 4 core tabs (clear hierarchy)
- ✅ Immediate action clarity ("Today's Route")
- ✅ Labeled, vertical habit list
- ✅ Full mountain theming (colors, backgrounds, typography)
- ✅ Color-coded difficulty grades

### Engagement Goals:
- Daily active users complete 30%+ more habits
- Time to first habit check: < 5 seconds
- User confusion tickets: -80%
- App store rating: 4.5+ stars

---

## IMPLEMENTATION CHECKLIST

### Week 1: Architecture
- [ ] Create new BaseCamp.tsx (merge WeeklyHub + Dashboard)
- [ ] Create Logbook.tsx (merge HabitsMountain + stats)
- [ ] Create ExpeditionPlanner.tsx (merge Goals + Missions + WorldMap)
- [ ] Create GearLocker.tsx (merge Settings + AlpineShop)
- [ ] Update App.tsx routing
- [ ] Test all features still accessible

### Week 2: Visual Design
- [ ] Define DIFFICULTY_COLORS constant
- [ ] Create mountain theme CSS files (El Cap, K2, Denali)
- [ ] Enhance useMountainTheme hook
- [ ] Create DifficultyBadge component
- [ ] Update global.css with new design tokens

### Week 3: Components
- [ ] Create MountainHeader component
- [ ] Create ClimbingRouteView component
- [ ] Create Pitch component
- [ ] Create SummitGoal component
- [ ] Create WeekProgress component
- [ ] Implement animations (Framer Motion)

### Week 4: Data & Backend
- [ ] Add difficulty + grade columns to habits table
- [ ] Write migration to set default difficulties
- [ ] Update habit creation form (add difficulty selector)
- [ ] Update API responses to include difficulty
- [ ] Test theme switching with real data

### Week 5: Polish
- [ ] Delete unused files
- [ ] Update all imports
- [ ] Run TypeScript checks
- [ ] Run Playwright tests (update assertions)
- [ ] Create first-time user tour
- [ ] Deploy to staging
- [ ] User testing with 3-5 beta testers
- [ ] Deploy to production

---

## ROLLBACK PLAN

If redesign causes issues:

1. **Immediate rollback:** Git revert to pre-redesign commit
2. **Feature flag:** Add `ENABLE_NEW_UI=false` env var to show old UI
3. **Gradual rollout:** Show new UI to 10% → 50% → 100% of users

---

## APPENDIX: Mountain Theme Specifications

### El Capitan (Warm Granite)
- **Primary Colors:** Warm oranges, golds, tans
- **Background:** Gradient from dark brown to rust
- **Accent:** Bright sunset orange
- **Typography:** Bold, confident (Outfit font)
- **Mood:** Sunny California vibes

### K2 (Harsh Ice)
- **Primary Colors:** Cold blues, whites, steel grays
- **Background:** Dark slate with icy highlights
- **Accent:** Electric ice blue
- **Typography:** Sharp, angular (Work Sans font)
- **Mood:** Unforgiving, dangerous

### Denali (Arctic Wilderness)
- **Primary Colors:** Deep blues, crisp whites
- **Background:** Dark navy with aurora hints
- **Accent:** Bright cyan
- **Typography:** Clean, nordic (Inter font)
- **Mood:** Pristine, challenging

### Everest (To be added)
- **Primary Colors:** Blacks, deep purples, gold accents
- **Background:** Almost black with subtle gradients
- **Accent:** Golden sunrise
- **Typography:** Elite, prestigious
- **Mood:** Ultimate challenge, thin air

---

**End of Redesign Plan**

Next Steps: Review and approve, then begin Week 1 implementation.
