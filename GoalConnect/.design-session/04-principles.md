# F4: Design Principles - Strava/Kilter Pages

## Design Philosophy

**Core Emotion:** "I'm a champion" - Every element should make the user feel proud of their accomplishments.

**Inspired By:** Summit Journal energy + Strava's athletic edge + Apple's polish

---

## Visual Style

### Style Classification
**Primary:** Dark Glassmorphism with Gradient Accents
**Secondary:** Data Storytelling with Animated Reveals

### Color Palette

```
Primary Background:    hsl(var(--background))     Dark base
Card Background:       rgba(255,255,255,0.05)     Glass effect
Card Border:           rgba(255,255,255,0.1)      Subtle edge

Strava Orange:         #FC4C02                    Energy, athletic
Strava Orange Light:   #FF6B35                    Hover states
Running Accent:        #FF8C42                    Warm energy

Kilter Teal:           #00D4AA                    Growth, progress
Kilter Teal Light:     #00F5C4                    Highlights
Climbing Accent:       #7C3AED                    Achievement purple

Success/PR:            hsl(var(--success))        Green celebrations
Warning:               #F59E0B                    Amber alerts
Text Primary:          hsl(var(--foreground))     High contrast
Text Muted:            hsl(var(--muted-foreground))
```

### Gradient Patterns
```css
/* Hero backgrounds */
.strava-hero: linear-gradient(135deg, #FC4C02/20, transparent, #FF6B35/10)
.kilter-hero: linear-gradient(135deg, hsl(var(--primary))/20, transparent, hsl(var(--accent))/10)

/* Card accents */
.glass-card: bg-white/5 backdrop-blur-xl border-white/10

/* Text gradients (for big numbers) */
.gradient-text: bg-gradient-to-r from-[#FC4C02] to-[#FF8C42] bg-clip-text
```

---

## Typography

### Hierarchy
```
Hero Numbers:     text-5xl md:text-6xl font-bold    "2,551"
Hero Unit:        text-2xl md:text-3xl font-semibold "miles"
Section Titles:   text-xs uppercase tracking-widest  "YOUR RUNNING JOURNEY"
Card Titles:      text-lg font-semibold              "Personal Records"
Stats:            text-2xl font-bold                 "42"
Labels:           text-sm text-muted-foreground      "Total Runs"
Body:             text-sm                            Descriptions
Micro:            text-[10px] text-muted-foreground  Chart labels
```

### Font Stack
- Primary: System font stack (already configured)
- Numbers: `tabular-nums` for aligned digits

---

## Layout Principles

### Page Structure
```
[Back Button]
[Page Title + Subtitle]
[Hero Section - Full width, celebration-focused]
[Bento Grid - 2 column on desktop, 1 column mobile]
  [Large Card]  [Medium Card]
  [Medium Card] [Medium Card]
  [Small Cards Row]
```

### Spacing Scale (4px base)
```
Page padding:     px-4 (16px)
Section gaps:     space-y-6 (24px)
Card padding:     p-4 md:p-6 (16-24px)
Card gaps:        gap-4 (16px)
Element spacing:  gap-2, gap-3 (8-12px)
```

### Card Sizes (Bento Grid)
- **Hero:** Full width, 200-300px height
- **Large:** 2 columns, flexible height
- **Medium:** 1 column, ~200px height
- **Small:** 1/2 or 1/3 width, ~120px height

---

## Component Patterns

### Glass Card
```tsx
className="bg-background/40 backdrop-blur-xl border border-foreground/10 rounded-2xl shadow-lg"
// or
className="glass-card" // if defined in globals
```

### Stat Card Pattern
```
[Icon]
[Big Number]  ← Animated CountUp
[Label]       ← Muted text
[Trend Arrow] ← Optional, colored
```

### Achievement Badge Pattern
```
[Colored Background Circle/Ring]
  [Icon or Emoji]
[Title]       ← Bold
[Description] ← Muted, small
```

### Progress Ring Pattern
```
[SVG Circle Track]  ← Muted stroke
[SVG Circle Fill]   ← Gradient stroke, animated
[Center Content]    ← Number + Label
```

---

## Animation Principles

### Entry Animations
```tsx
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.5 }}
```

### Staggered Children
```tsx
transition={{ delay: index * 0.1 }}
```

### Number CountUp
```tsx
// Use framer-motion animate()
const count = useMotionValue(0);
animate(count, value, { duration: 1.5, ease: "easeOut" });
```

### Micro-interactions
- **Hover on cards:** `hover:border-foreground/20 transition-colors`
- **Button press:** `active:scale-95 transition-transform`
- **Success:** Confetti burst (canvas-confetti)
- **Loading:** Skeleton pulse or spinner

### Timing Guidelines
- Entry: 300-500ms
- Hover: 150-200ms
- Number count: 1000-1500ms
- Stagger delay: 100-150ms per item

---

## Data Visualization

### Chart Styles
```tsx
// Line/Area Charts
fill="url(#gradientFill)"
stroke="hsl(var(--primary))"
strokeWidth={2}

// Gradient definitions
<linearGradient id="gradientFill" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
</linearGradient>
```

### Progress Rings
- Track: `stroke="hsl(var(--muted))" strokeWidth="8"`
- Fill: `stroke="url(#ringGradient)" strokeWidth="8" strokeLinecap="round"`
- Animation: `stroke-dashoffset` from full to target

### Calendar Heatmap
- Empty: `bg-muted/20`
- Low: `bg-primary/30`
- Medium: `bg-primary/60`
- High: `bg-primary`

---

## Content Strategy

### Hero Section Content
```
[Micro label]        "YOUR RUNNING JOURNEY"
[Big comparison]     "You've run 47 marathons worth of distance"
[Supporting stat]    "That's 1,232 miles since you started"
[Quick stats row]    [Runs] [Hours] [Calories]
```

### Comparisons That Inspire
**For Running:**
- "X marathons worth of distance"
- "Enough to run from NYC to Miami"
- "X trips around Central Park"

**For Climbing:**
- "Climbed X times the height of Everest"
- "Sent X problems (that's X per session!)"

### Achievement Labels
- Use active, celebratory language
- "Longest Run Ever" not "Maximum distance"
- "Crushing It" not "Above average"

---

## Accessibility

### Color Contrast
- Text on dark bg: minimum 4.5:1 ratio
- Interactive elements: minimum 3:1 ratio
- Never rely on color alone (use icons, patterns)

### Motion
- Respect `prefers-reduced-motion`
- Provide static fallbacks for animations

### Focus States
- Visible focus rings on all interactive elements
- `focus-visible:ring-2 focus-visible:ring-primary`

---

## Page-Specific Decisions

### Strava Page
- **Hero:** Running route visualization or big distance number
- **Accent Color:** Strava Orange (#FC4C02)
- **Key Metrics:** Distance, Time, Runs, Pace
- **Unique Element:** Activity type breakdown (run/ride/swim)

### Kilter Page (Summit Journal Evolution)
- **Hero:** Mountain comparison (keep existing)
- **Accent Color:** Primary gradient
- **Key Metrics:** Sends, Sessions, Max Grade, Hours
- **Unique Element:** Grade pyramid, personality analysis

---

## Design Tokens Summary

```css
:root {
  /* Strava-specific */
  --strava-orange: 24 100% 50%;        /* #FC4C02 */
  --strava-orange-light: 20 100% 60%;  /* #FF6B35 */
  
  /* Animation */
  --duration-fast: 150ms;
  --duration-normal: 300ms;
  --duration-slow: 500ms;
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  
  /* Shadows */
  --shadow-card: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-glow: 0 0 20px rgb(var(--primary) / 0.3);
}
```
