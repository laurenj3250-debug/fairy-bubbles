# F4: Design Principles - Fairy Bubbles Homepage

## Design Vision
A **polished, climbing-themed dashboard** that evokes feelings of **satisfaction and pride** when viewing progress. Dense with information but organized through clear hierarchy. Premium feel without losing the climby personality.

---

## Color Palette

### Primary Colors (from existing system)
| Role | HSL | Hex Approx | Usage |
|------|-----|------------|-------|
| **Background** | 45 30% 12% | #2A2419 | Deep warm charcoal base |
| **Foreground** | 40 20% 95% | #F5F3F0 | Primary text |
| **Card** | 40 20% 18% | #3A3229 | Card backgrounds |
| **Primary (Alpenglow)** | 25 95% 58% | #F97316 | Primary accent - CTAs, highlights, streaks |
| **Secondary (Sky)** | 200 85% 55% | #0EA5E9 | Secondary accent - routes, links |
| **Accent (Teal)** | 160 80% 50% | #14B8A6 | Success states, completion |

### Accent Usage Rules
1. **Orange (Primary)**: Streaks, important metrics, primary CTAs
2. **Blue (Secondary)**: Routes, navigation, links
3. **Teal (Accent)**: Completions, success states, positive feedback
4. **Reserve bright colors** for data/actions - backgrounds stay muted

### Category Colors (Standardized)
```css
--category-mind: rgba(139, 92, 246, 0.3);      /* Purple */
--category-foundation: rgba(251, 146, 60, 0.3); /* Orange */
--category-adventure: rgba(34, 197, 94, 0.3);   /* Green */
--category-climbing: rgba(14, 165, 233, 0.3);   /* Blue */
```

---

## Typography

### Font Stack
- **Headings**: Fraunces (serif, 600 weight) - distinctive, premium
- **Body**: Inter (sans-serif, 400-500) - clean, readable

### Scale
| Level | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| Hero | 48px | 600 | 1.1 | Main dashboard greeting |
| H1 | 32px | 600 | 1.2 | Section titles |
| H2 | 24px | 600 | 1.3 | Card titles |
| H3 | 18px | 500 | 1.4 | Widget headers |
| Body | 16px | 400 | 1.5 | Primary content |
| Small | 14px | 400 | 1.4 | Secondary text |
| Caption | 12px | 400 | 1.3 | Labels, timestamps |

### Typography Rules
1. **Hero text**: Use Fraunces, warm greeting, single line
2. **Metrics/numbers**: Use Inter with tabular figures, larger size (20-32px)
3. **Labels**: Use Inter 12px, muted foreground color
4. **No text-transform: uppercase** except for very short labels

---

## Spacing System

### Base Unit: 4px
```
xs: 4px   (0.25rem)
sm: 8px   (0.5rem)
md: 16px  (1rem)
lg: 24px  (1.5rem)
xl: 32px  (2rem)
2xl: 48px (3rem)
```

### Card Padding
- **Standard cards**: 24px (lg)
- **Compact widgets**: 16px (md)
- **Dense content**: 12px (sm)

### Section Gaps
- **Between major sections**: 24px (lg)
- **Between cards in grid**: 16px (md)
- **Between elements in card**: 12px (sm)

### Layout Grid
- **Max content width**: 1440px
- **Side margins**: 24px (desktop), 16px (tablet), 12px (mobile)
- **Column gap**: 16px

---

## Visual Polish

### Card Styling
```css
.polished-card {
  background: hsl(40 20% 18% / 0.8);
  backdrop-filter: blur(12px);
  border: 1px solid hsl(40 20% 30% / 0.3);
  border-radius: 16px;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.2),
    0 2px 4px -2px rgba(0, 0, 0, 0.1);
}
```

### Glassmorphism (Selective)
- **Use for**: Overlays, floating elements, navigation
- **Blur**: 12-16px
- **Opacity**: 70-85%
- **Border**: 1px solid with 20-30% opacity white/light

### Shadows
| Level | Usage | Value |
|-------|-------|-------|
| None | Flat elements | - |
| Subtle | Cards at rest | `0 2px 4px rgba(0,0,0,0.1)` |
| Medium | Cards on hover | `0 4px 8px rgba(0,0,0,0.15)` |
| Strong | Modals, dropdowns | `0 8px 16px rgba(0,0,0,0.2)` |

### Gradients
1. **Background gradient**: Subtle radial from center (slightly lighter) to edges
2. **Accent gradient**: Orange to amber for streak highlights
3. **Progress gradient**: Teal to green for completion states

### Border Radius
- **Cards**: 16px (rounded-2xl)
- **Buttons**: 8px (rounded-lg)
- **Inputs**: 8px (rounded-lg)
- **Badges/pills**: Full (rounded-full)
- **Icons containers**: 12px (rounded-xl)

---

## Background Texture

### Topographic Pattern
Subtle contour/topo lines in the background to reinforce climbing theme:
```css
.topo-background {
  background-image: url("data:image/svg+xml,...");
  background-size: 400px 400px;
  opacity: 0.03;
  pointer-events: none;
}
```

- **Opacity**: 2-5% - barely visible but adds depth
- **Pattern**: Organic contour lines, not rigid grid
- **Color**: Foreground color at low opacity

---

## Interaction & Animation

### Timing
| Type | Duration | Easing |
|------|----------|--------|
| Micro (hover, focus) | 150ms | ease-out |
| Standard (expand, slide) | 250ms | ease-in-out |
| Complex (modal, page) | 350ms | cubic-bezier(0.4, 0, 0.2, 1) |
| Celebration | 600ms | spring |

### Hover States
```css
.card-hover {
  transition: transform 150ms ease-out, box-shadow 150ms ease-out;
}
.card-hover:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
}
```

### Completion Animations
1. **Habit check**: Scale pulse (1 → 1.1 → 1) + glow
2. **Streak milestone**: Confetti burst + haptic
3. **Goal progress**: Smooth progress bar fill + subtle bounce

### Spring Physics (Framer Motion)
```js
const springConfig = {
  gentle: { stiffness: 200, damping: 20 },
  snappy: { stiffness: 400, damping: 25 },
  bouncy: { stiffness: 300, damping: 10 }
};
```

---

## Information Hierarchy

### Visual Weight (Highest to Lowest)
1. **Today's progress** - Hero area, largest, brightest accent
2. **Streak count** - Orange accent, prominent number
3. **Habits list** - Interactive, checkable
4. **Goals/mountains** - Visual progress indicators
5. **Weekly rhythm** - Heatmap/calendar view
6. **Secondary widgets** - Smaller, muted

### Layout Structure
```
┌─────────────────────────────────────────────────┐
│ Header: Greeting + Date + Tokens               │
├─────────────────────┬───────────────────────────┤
│                     │                           │
│  Habits             │  Goals/Mountains          │
│  (Primary)          │  (Primary)                │
│                     │                           │
├─────────────────────┴───────────────────────────┤
│  Heatmap  │  Weekly Rhythm  │  Peak Lore        │
│  (Secondary widgets - equal weight)             │
├─────────────────────────────────────────────────┤
│  Summit Log (Monthly accomplishments)           │
└─────────────────────────────────────────────────┘
```

---

## Mood & Personality

### Emotional Keywords
- Satisfied
- Proud
- Accomplished
- Motivated
- Premium
- Climby (not corporate)

### Climbing Metaphor Integration
- **Habits** = Daily pitches to climb
- **Streaks** = Rope length / ascent progress
- **Goals** = Mountain summits to reach
- **Weekly view** = Ridge traverse
- **Completions** = Summit celebrations

### Copy Tone
- Aspirational but not preachy
- Brief and confident
- Climbing terminology naturally integrated
- Personal ("your journey") not generic ("users can...")

---

## Accessibility

### Color Contrast
- Text on backgrounds: Minimum 4.5:1 ratio
- Large text: Minimum 3:1 ratio
- Interactive elements: Clear focus states

### Focus States
```css
:focus-visible {
  outline: 2px solid hsl(var(--primary));
  outline-offset: 2px;
}
```

### Touch Targets
- Minimum 44x44px for interactive elements
- Adequate spacing between tap targets

### Motion
- Respect `prefers-reduced-motion`
- Essential animations only in reduced motion mode

---

## Polish Checklist

### Before Build
- [ ] All colors from CSS variables (no hardcoded hex)
- [ ] Consistent border-radius (16px cards, 8px buttons)
- [ ] Unified shadow system
- [ ] Spacing from 4px grid

### During Build
- [ ] Hover states on all interactive elements
- [ ] Focus states visible
- [ ] Loading states styled (skeleton, not spinner)
- [ ] Empty states designed

### After Build
- [ ] Animation timing consistent
- [ ] No layout shift on load
- [ ] Responsive at all breakpoints
- [ ] Celebration animations feel rewarding
