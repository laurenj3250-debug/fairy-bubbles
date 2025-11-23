# Fitness Shrine - Design Specification

> "Your climbing year in review, but make it absurd."

## Concept

**Spotify Wrapped meets Strava Year in Review** - A scroll-based story experience that reveals climbing stats progressively with personality, humor, and genuine insights.

---

## Design Philosophy

### Tone
**Editorial maximalist meets gaming achievement** - like a luxury sports magazine collided with a video game stats screen. Bold typography, generous whitespace, dramatic reveals.

### Core Psychology (Spotify Wrapped playbook)
1. **Curiosity Gap** - tease "you climbed more than X% of users" before reveal
2. **Identity Reinforcement** - assign climbing personality type
3. **Sharable Pride** - stats formatted for screenshots
4. **Temporal Reflection** - frame as a "journey" with clear start/end

### What Makes It FUN (not boring)
- **Absurd comparisons**: "You lifted 2.3 elephants" > "12,450 lbs lifted"
- **Personality typing**: "You're a Volume Warrior" with archetype art
- **Count-up animations**: Numbers tick up dramatically
- **Scroll-triggered reveals**: Each section appears as you scroll
- **Achievement unlocks**: "Unlocked: V6 Club" with fanfare

---

## Data Sources

### Kilter Board (Auto-sync)
```typescript
interface ClimbingSession {
  sessionDate: string;
  problemsAttempted: number;
  problemsSent: number;
  averageGrade: string;    // "V4"
  maxGrade: string;        // "V7"
  boardAngle: number;      // 40
  durationMinutes: number;
  climbs: ClimbDetail[];   // individual problems
}
```

### Apple Health (Manual XML upload - future)
- Workouts (duration, calories, type)
- Activity rings (move, exercise, stand)
- Heart rate zones

---

## Information Architecture

### 5-Section Scroll Story

```
┌─────────────────────────────────────┐
│     SECTION 1: THE HOOK             │
│     "You had a year."               │
│     [Scroll to discover]            │
└─────────────────────────────────────┘
          ↓ scroll
┌─────────────────────────────────────┐
│     SECTION 2: THE NUMBERS          │
│     Total sessions, problems, sends │
│     Count-up animation              │
└─────────────────────────────────────┘
          ↓ scroll
┌─────────────────────────────────────┐
│     SECTION 3: THE PYRAMID          │
│     Grade distribution viz          │
│     "V4 is your sweet spot"         │
└─────────────────────────────────────┘
          ↓ scroll
┌─────────────────────────────────────┐
│     SECTION 4: THE PERSONALITY      │
│     "You're a PROJECT CRUSHER"      │
│     Archetype reveal with traits    │
└─────────────────────────────────────┘
          ↓ scroll
┌─────────────────────────────────────┐
│     SECTION 5: THE PRIDE MOMENTS    │
│     Max grade, best session         │
│     Absurd comparisons              │
└─────────────────────────────────────┘
```

---

## Section Designs

### Section 1: The Hook
**Purpose**: Create anticipation, establish tone

```
┌────────────────────────────────────────────┐
│                                            │
│                                            │
│         ✦ 2024 CLIMBING REPORT ✦          │
│                                            │
│              "You had a year."             │
│                                            │
│           [arrow animation ↓]              │
│            Scroll to discover              │
│                                            │
└────────────────────────────────────────────┘
```

**Typography**: Fraunces 72px "CLIMBING REPORT", Inter 16px subtitle
**Animation**: Subtle floating arrow, text fade-in on load

---

### Section 2: The Numbers
**Purpose**: Big stat reveals with count-up animations

```
┌────────────────────────────────────────────┐
│                                            │
│    ┌─────────┐  ┌─────────┐  ┌─────────┐  │
│    │   47    │  │   312   │  │   78%   │  │
│    │sessions │  │problems │  │send rate│  │
│    └─────────┘  └─────────┘  └─────────┘  │
│                                            │
│         That's more climbing than          │
│         94% of GoalConnect users           │
│                                            │
└────────────────────────────────────────────┘
```

**Typography**: Fraunces 96px numbers, Inter 14px labels
**Animation**:
- Numbers count up from 0 (2s duration, easeOut)
- Stagger each stat by 300ms
- Percentage comparison fades in after numbers complete

---

### Section 3: The Pyramid
**Purpose**: Show grade distribution as climbing pyramid

```
┌────────────────────────────────────────────┐
│                                            │
│         YOUR GRADE PYRAMID                 │
│                                            │
│              ┌───┐                         │
│              │V7 │ 3                       │
│            ┌─┴───┴─┐                       │
│            │  V6   │ 12                    │
│          ┌─┴───────┴─┐                     │
│          │    V5     │ 28                  │
│        ┌─┴───────────┴─┐                   │
│        │      V4       │ 67   ← sweet spot │
│      ┌─┴───────────────┴─┐                 │
│      │        V3         │ 89              │
│    ┌─┴───────────────────┴─┐               │
│    │          V2           │ 43            │
│                                            │
│    "V4 is your comfort zone.               │
│     You've got 12 V6s in you."             │
│                                            │
└────────────────────────────────────────────┘
```

**Visualization**: Pyramid chart (custom Recharts or SVG)
- Each tier is a grade, width = count
- Colors gradient from warm (V0-V3) to hot (V4-V7+)
- "Sweet spot" badge on most-climbed grade

**Animation**: Pyramid builds from bottom up, each tier slides in

---

### Section 4: The Personality
**Purpose**: Classify climbing style, create shareable identity

**Personality Types:**
| Type | Criteria | Vibe |
|------|----------|------|
| Volume Warrior | 80%+ on warmup grades | Quantity over quality |
| Project Crusher | Low send rate, high max | Patient perfectionist |
| Consistency King | Regular sessions, steady pyramid | The reliable one |
| Flash Master | High first-try sends | Natural talent |
| Angle Demon | 45°+ preferred angle | Steep specialist |

```
┌────────────────────────────────────────────┐
│                                            │
│              You're a                      │
│                                            │
│    ╔═══════════════════════════════════╗   │
│    ║                                   ║   │
│    ║      PROJECT CRUSHER              ║   │
│    ║                                   ║   │
│    ║   "Low sends, high max grade.     ║   │
│    ║    You don't do easy. You do      ║   │
│    ║    impossible, eventually."       ║   │
│    ║                                   ║   │
│    ╚═══════════════════════════════════╝   │
│                                            │
│    Your traits:                            │
│    • 23% send rate (selective)             │
│    • V7 max (ambitious)                    │
│    • 4.2 avg attempts per send (patient)   │
│                                            │
└────────────────────────────────────────────┘
```

**Typography**: Fraunces 48px type name, Inter 18px description
**Animation**: Card flips to reveal type, traits fade in sequentially

---

### Section 5: The Pride Moments
**Purpose**: Absurd comparisons, achievements, best moments

```
┌────────────────────────────────────────────┐
│                                            │
│         YOUR GREATEST HITS                 │
│                                            │
│    ┌─────────────────────────────────┐     │
│    │  🏔️ MAX GRADE: V7               │     │
│    │  "Welcome to the V7 club"       │     │
│    └─────────────────────────────────┘     │
│                                            │
│    ┌─────────────────────────────────┐     │
│    │  ⏱️ LONGEST SESSION: 2h 34m     │     │
│    │  Nov 15th - you were LOCKED IN  │     │
│    └─────────────────────────────────┘     │
│                                            │
│    ┌─────────────────────────────────┐     │
│    │  🐘 TOTAL WEIGHT MOVED          │     │
│    │  "That's 2.3 elephants"         │     │
│    │  (12,450 lbs of body weight     │     │
│    │   climbing x attempts)           │     │
│    └─────────────────────────────────┘     │
│                                            │
│    ┌─────────────────────────────────┐     │
│    │  🗼 VERTICAL FEET CLIMBED       │     │
│    │  "1.2 Eiffel Towers"            │     │
│    │  (3,936 feet)                   │     │
│    └─────────────────────────────────┘     │
│                                            │
└────────────────────────────────────────────┘
```

**Absurd Comparison Ideas:**
- Weight moved → elephants
- Vertical feet → Eiffel Towers / Empire State Buildings
- Time climbing → episodes of The Office
- Total attempts → "enough tries to learn piano"

---

## Visual Design

### Color Palette
Using existing cliff-sampled CSS variables:
```css
--cliff-orange: 25 80% 55%;   /* Primary accent */
--cliff-navy: 220 30% 15%;    /* Deep backgrounds */
--cliff-sand: 40 30% 75%;     /* Highlights */
--primary: 25 95% 58%;        /* Bright orange/gold */
```

### Typography
- **Display**: Fraunces (existing) - 48-96px for big numbers
- **Body**: Inter (existing) - 14-18px for descriptions
- **Accent**: Inter Medium uppercase for labels

### Motion (Framer Motion)
```tsx
// Scroll-triggered fade up
<motion.div
  initial={{ opacity: 0, y: 40 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, margin: "-100px" }}
  transition={{ duration: 0.6, ease: "easeOut" }}
>

// Count-up number
const count = useMotionValue(0);
const rounded = useTransform(count, Math.round);
useEffect(() => {
  animate(count, targetValue, { duration: 2, ease: "easeOut" });
}, []);
```

---

## Component Architecture

```
FitnessShrine/
├── FitnessShrine.tsx           # Main page with scroll sections
├── components/
│   ├── HeroSection.tsx         # "You had a year" intro
│   ├── StatsReveal.tsx         # Count-up numbers
│   ├── GradePyramid.tsx        # Pyramid visualization
│   ├── PersonalityCard.tsx     # Climbing archetype
│   ├── PrideMoments.tsx        # Best-of cards
│   └── AbsurdComparison.tsx    # Fun stat conversions
├── hooks/
│   └── useClimbingStats.ts     # Aggregate Kilter data
└── utils/
    ├── calculatePersonality.ts # Determine archetype
    └── absurdConversions.ts    # Elephant math
```

---

## Implementation Phases

### Phase 1: MVP (This Sprint)
- [x] Research complete
- [ ] Basic scroll page structure
- [ ] Count-up stat cards
- [ ] Simple grade bar chart
- [ ] Placeholder personality section

### Phase 2: Delight
- [ ] Pyramid visualization
- [ ] Personality algorithm
- [ ] Absurd comparisons
- [ ] Share button (screenshot-ready)

### Phase 3: Polish
- [ ] Apple Health integration
- [ ] Year-over-year comparison
- [ ] Monthly breakdown option
- [ ] Confetti on achievements

---

## Technical Notes

### Data Aggregation Query
```typescript
// useClimbingStats.ts
const stats = useMemo(() => {
  const sessions = data?.sessions || [];
  return {
    totalSessions: sessions.length,
    totalProblems: sessions.reduce((sum, s) => sum + s.problemsAttempted, 0),
    totalSends: sessions.reduce((sum, s) => sum + s.problemsSent, 0),
    sendRate: totalSends / totalProblems * 100,
    maxGrade: getMaxGrade(sessions),
    gradeDistribution: buildPyramid(sessions),
    longestSession: Math.max(...sessions.map(s => s.durationMinutes)),
    // etc.
  };
}, [data]);
```

### Personality Algorithm (Simplified)
```typescript
function calculatePersonality(stats: ClimbingStats): PersonalityType {
  const { sendRate, maxGradeNumeric, avgGradeNumeric, avgAttempts, preferredAngle } = stats;

  if (sendRate > 80 && avgGradeNumeric < maxGradeNumeric - 2) return 'VOLUME_WARRIOR';
  if (sendRate < 30 && maxGradeNumeric > avgGradeNumeric + 2) return 'PROJECT_CRUSHER';
  if (avgAttempts < 2) return 'FLASH_MASTER';
  if (preferredAngle >= 45) return 'ANGLE_DEMON';
  return 'CONSISTENCY_KING';
}
```

---

## References

- [Spotify Wrapped 2023 Case Study](https://spotify.design/article/wrapped-2023)
- [Strava Year in Sport](https://blog.strava.com/year-in-sport/)
- [Grade Pyramid Training](https://www.climbingmagazine.com/skills/grade-pyramid/)
- Framer Motion scroll animations docs

---

*Document created: Nov 22, 2024*
*Status: Ready for implementation*
