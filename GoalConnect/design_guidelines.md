# Gremlin Dashboard Design Guidelines

## Design Approach

**Selected Framework**: Whimsical gamification combining playful, organic aesthetics with motivational feedback patterns, built on shadcn/ui component primitives.

**Core Principles**:
- **Whimsical & Welcoming**: Soft pastels, rounded shapes, and friendly illustrations create a joyful experience
- **Playful Motivation**: Visual celebrations, encouraging copy, and game-like progression
- **Touch-Optimized**: All interactive elements minimum 44×44px tap targets with generous padding
- **Warm & Organic**: Gradients, soft shadows, and flowing shapes over sharp edges
- **Pet-Centered**: Virtual pet is the heart of the experience, driving engagement

**Aesthetic Keywords**: Soft, warm, playful, rounded, pastel, encouraging, gentle, whimsical

---

## Color System

### Pastel Palette Philosophy
The app uses a warm, soft pastel palette inspired by nature and whimsical illustrations. Colors should feel gentle, inviting, and playful - never harsh or overly saturated.

### Core Color Tokens (Light Mode)

**Primary** (Soft Teal): `hsl(170 60% 60%)`
- Main accent color for buttons, active states, highlights
- Usage: Primary buttons, selected nav items, progress fills

**Secondary** (Warm Peach): `hsl(25 90% 70%)`
- Complementary warm accent for secondary actions
- Usage: Secondary buttons, warm highlights, accent badges

**Background** (Soft Cream): `hsl(40 100% 96%)`
- Main app background, creates warmth
- Usage: Body background, card backgrounds on tinted surfaces

**Card** (Pure White with Warmth): `hsl(0 0% 100%)`
- Elevated surfaces, clean containers
- Usage: Cards, dialogs, sheets

**Accent** (Soft Lavender): `hsl(260 40% 75%)`
- Tertiary accent for variety and visual interest
- Usage: Badges, special states, decorative elements

**Muted** (Soft Sage): `hsl(150 20% 88%)`
- Subtle backgrounds, disabled states
- Usage: Input backgrounds, disabled buttons, subtle dividers

### Gradient Primitives

**Sunrise Gradient** (Hero/Pet Habitat):
```css
background: linear-gradient(135deg, hsl(35 100% 88%) 0%, hsl(15 85% 75%) 100%);
```
- Usage: Pet display backgrounds, hero sections, warm CTAs

**Lagoon Gradient** (Calm Backgrounds):
```css
background: linear-gradient(135deg, hsl(180 70% 88%) 0%, hsl(170 60% 75%) 100%);
```
- Usage: Alternate section backgrounds, calm empty states

**Radial Highlight** (Soft Glow):
```css
background: radial-gradient(circle at center, hsl(var(--primary) / 0.15) 0%, transparent 70%);
```
- Usage: Behind FAB, behind pet, soft emphasis

### Semantic Colors

**Success** (Gentle Green): `hsl(140 50% 65%)`
- Completion states, positive feedback
- Usage: Checkmarks, success messages, completed tasks

**Warning** (Soft Amber): `hsl(40 85% 65%)`
- Attention needed, upcoming deadlines
- Usage: Due soon badges, gentle warnings

**Destructive** (Muted Coral): `hsl(5 70% 70%)`
- Delete actions, errors (softer than typical red)
- Usage: Delete buttons, error states

### Text Colors (Layered Hierarchy)

**Foreground** (Warm Charcoal): `hsl(220 15% 25%)`
- Primary text, headlines, emphasis

**Muted Foreground** (Soft Gray): `hsl(220 10% 55%)`
- Secondary text, descriptions, metadata

**Tertiary Foreground** (Very Soft Gray): `hsl(220 8% 70%)`
- Subtle hints, placeholders, least important text

### Usage Guidelines
- Use gradients sparingly for hero moments (pet display, empty states, special cards)
- Prefer pastels over saturated colors - if it feels too bright, reduce saturation by 10-15%
- Text must always have sufficient contrast (WCAG AA minimum)
- Shadows should have color tints (not pure black) for softer feel

---

## Typography System

### Font Stack
**Primary**: Inter (via Google Fonts) - exceptional legibility at small sizes, clean numerals
**Fallback**: system-ui, -apple-system, sans-serif

### Type Scale
- **Hero Numbers** (streaks, stats): text-5xl (48px), font-bold, tabular-nums
- **Page Titles**: text-2xl (24px), font-semibold, tracking-tight
- **Section Headers**: text-lg (18px), font-semibold
- **Card Titles**: text-base (16px), font-medium
- **Body Text**: text-sm (14px), font-normal, leading-relaxed
- **Labels/Metadata**: text-xs (12px), font-medium, uppercase, tracking-wide
- **Microcopy**: text-xs (12px), font-normal

### Usage Guidelines
- Numbers always use `tabular-nums` for alignment in lists/charts
- Habit/goal titles: font-medium for scanability
- Success states use font-semibold to emphasize achievement
- All caps reserved for category labels and navigation items only

---

## Layout System

### Spacing Primitives
**Core Units**: Tailwind spacing of 2, 4, 6, 8, 12, 16
- **Micro spacing** (p-2, gap-2): Within button groups, icon-to-text
- **Component padding** (p-4, p-6): Card interiors, list items
- **Section spacing** (gap-8, py-8): Between card groups, page sections
- **Page margins** (p-4, md:p-6): Outer container padding
- **Large breathing room** (py-12, gap-12): Between major dashboard sections

### Grid Structure
**Mobile** (default):
- Single column layout
- Full-width cards with rounded-xl borders
- 16px horizontal page margins (px-4)
- 24px vertical spacing between cards (gap-6)

**Tablet/Desktop** (md: 768px+):
- 2-column grid for dashboard cards (grid-cols-2)
- 3-column for habit lists (grid-cols-3)
- max-w-7xl container, mx-auto
- 24px gaps between columns (gap-6)

**Layout Patterns**:
- **Dashboard**: Masonry-style grid with varying card heights
- **Lists** (Habits/Goals): Uniform height cards in responsive grid
- **Bottom Navigation**: Fixed, full-width, h-16, safe-area-inset-bottom
- **FAB**: Fixed bottom-right (bottom-20, right-4) to clear bottom nav

---

## Component Library

### Navigation
**Bottom Navigation Bar**:
- Height: h-16, fixed positioning with backdrop-blur-lg
- Icons: 24px from Heroicons (outline default, solid when active)
- Labels: text-xs, always visible (not icon-only)
- Active state: Use primary accent, font-semibold
- Spacing: Equally distributed with justify-around

**Header**:
- Height: h-14, sticky top-0, backdrop-blur
- Left: Greeting text (text-lg, font-semibold)
- Right: Avatar/menu button (w-10 h-10 rounded-full)
- Bottom border: subtle divider

###Cards
**Base Card Pattern**:
- Border radius: rounded-3xl (24px) for soft, organic feel
- Padding: p-6 (cards) to p-8 (hero cards) for generous breathing room
- Border: None or very subtle (prefer elevation via shadow)
- Shadow: Soft layered shadows with color tint - `0 12px 24px hsl(220 15% 25% / 0.08), 0 4px 8px hsl(220 15% 25% / 0.04)`
- Background: Pure white or subtle gradient overlays
- Transition: all properties 300ms ease (slower, gentler)
- Hover lift: Slight scale (scale-[1.02]) + deeper shadow on desktop

**Card Variants**:
1. **Hero Pet Card**: Full-width, gradient background (sunrise), rounded-3xl, prominent pet display
2. **Stat Card**: Gradient icon background (32px with p-2 rounded-xl), large number (text-4xl), friendly label
3. **Today Habit Card**: Full-width, rounded-2xl, checkbox-style with generous tap area, soft hover
4. **Progress Card**: rounded-2xl, colored progress rings, playful metadata chips
5. **Goal Card**: Compact rounded-2xl, soft colored progress ring (80px), title, friendly deadline chip

**Special Cards**:
- **Empty State Cards**: Gradient backgrounds, large friendly icons, encouraging copy, rounded-3xl
- **Achievement Cards**: Gradient overlays, celebration graphics, rounded-3xl with glow effect

### Data Visualization

**Progress Rings** (Goal completion):
- Size: 80px outer diameter, 12px stroke width
- Center: Percentage (text-2xl, font-bold)
- Outer ring: Track (muted), progress arc (accent)
- Animation: Smooth arc draw on mount (duration-700)

**Heatmap Grid**:
- Cell size: 12px × 12px minimum (16px on desktop)
- Rounded corners: rounded-sm
- Gap: gap-1
- 7 rows (days) × 12 columns (weeks)
- Intensity levels: 5 distinct opacity steps (0%, 25%, 50%, 75%, 100%)
- Empty states: Use faint border outline
- Tooltip on hover (desktop): Date, count

**Progress Bars**:
- Height: h-2 for compact contexts, h-3 for emphasis
- Rounded: rounded-full
- Container: Full width with subtle track
- Fill: Smooth transition (transition-all duration-300)
- Show percentage text above (text-sm, font-medium)

**Bar Charts** (Weekly Progress):
- Bar width: Responsive (min-w-8)
- Height: Variable by value, max-h-32
- Rounded top: rounded-t-md
- Gap: gap-2
- Labels below: text-xs, day abbreviations
- Target line: Dashed horizontal line across chart

### Forms & Inputs

**Input Fields**:
- Height: h-12 for touch friendliness
- Padding: px-4
- Border radius: rounded-lg
- Border: 2px solid (for better visibility)
- Focus: Ring with 3px offset
- Label: text-sm, font-medium, mb-2

**Buttons**:
- **Primary**: h-12, px-8, rounded-xl (softer than sharp), font-semibold, text-base, gradient hover effect
- **Secondary**: Same size, rounded-xl, soft border, gentle hover lift
- **Icon buttons**: w-12 h-12, rounded-full, centered icon (20px), soft background hover
- **FAB**: w-16 h-16, rounded-full, soft shadow with color tint, gentle scale on hover, radial glow behind
- Minimum spacing between buttons: gap-4 (generous)
- All buttons: Soft shadows, never harsh borders, gentle transitions (duration-300)

**Toggle Switches**:
- Width: w-11, height: h-6
- Thumb: w-5 h-5, translates on state change
- Smooth transition: duration-200
- Use for habit completion checkmarks

**Date Picker**:
- Calendar grid: 7 columns, rounded-lg container
- Day cells: w-10 h-10, rounded-md
- Today: Ring indicator
- Selected: Filled state
- Quick presets: Chips above calendar (Today, 7d, 30d, All)

### Interactive Elements

**Habit Toggle Row** (Today Panel):
- Height: min-h-16 for comfortable tapping
- Layout: Flex with gap-4
- Left: Colored icon (32px) + Title (text-base, font-medium)
- Right: Large toggle switch or checkmark (w-12 h-12 tap area)
- Tap entire row to toggle
- Success state: Brief scale animation (scale-105, duration-200)

**Streak Pill**:
- Inline-flex, px-3, h-8, rounded-full
- Icon + Number (text-sm, font-bold, tabular-nums)
- Pulsing animation on new streak milestones (every 7 days)

**Sheet/Dialog**:
- Mobile: Bottom sheet (slide up from bottom, rounded-t-2xl)
- Desktop: Centered dialog (max-w-md, rounded-xl)
- Header: text-xl, font-semibold, sticky
- Body: Scrollable content area, py-6
- Footer: Sticky, button row with gap-3

### Empty States
- Background: Soft gradient (lagoon or sunrise based on context)
- Icon: 80px, playful and friendly, centered
- Heading: text-xl, font-semibold, mt-6, encouraging tone
- Description: text-base, text-center, max-w-sm, mt-3, warm and motivating
- CTA Button: Primary button with rounded-xl, mt-8
- Overall card: rounded-3xl, generous padding (p-12)
- Examples:
  - "No tasks yet" → "Ready to tackle your day? 🌟"
  - "Add your first habit" → "Let's build something amazing together!"

---

## Interaction Patterns

### Gestures & Touch
- **Swipe**: Enable swipe-to-delete on habit/goal list items (reveal delete button)
- **Long press**: On habit toggles to open quick note sheet
- **Pull to refresh**: On dashboard (subtle loading indicator)
- **Tap feedback**: All tappable elements scale-95 on active state (duration-100)

### Animations (Minimal & Purposeful)
1. **Page transitions**: Subtle fade + slight slide up (duration-200)
2. **Card entrance**: Staggered fade-in on dashboard load (delay increments of 50ms)
3. **Progress updates**: Smooth number counting animations
4. **Success celebrations**: Streak milestones trigger confetti burst (library: canvas-confetti)
5. **Skeleton loading**: Subtle pulse animation (pulse opacity 50%-100%)

### Loading States
- **Card skeletons**: Match card structure, rounded-xl, animated pulse
- **Inline loaders**: Small spinner (20px) for button loading states
- **Page loader**: Centered spinner with app icon overlay

---

## Dashboard Layout Specification

### Header Section
- Greeting: "Good morning, [Name]" with current date
- Quick actions menu: "+ New" opens action sheet

### Main Grid (Mobile: Single column, Desktop: 2-column masonry)

**Card Order (Priority-based)**:
1. **Today Panel** (Full width on mobile)
   - Title: "Today's Habits" with date
   - Habit rows: 3-5 visible, "Show all" if more
   - Large toggles with immediate feedback

2. **Current Streaks** (Half-width on desktop)
   - Top 3 streaks with fire emoji indicators
   - "🔥 7 Day Streak" format

3. **12-Week Heatmap** (Full width)
   - Title: "Activity Overview"
   - Scrollable on mobile, full on desktop
   - Legend: Completion intensity scale

4. **Weekly Progress** (Full width)
   - Title: "This Week" with date range
   - Bar chart with target lines
   - Summary: "X of Y completed"

5. **Active Goals** (Half-width cards)
   - Progress rings with titles
   - Deadline chips
   - Quick update button

6. **Quick Insights** (Full width)
   - 3-stat row: Most Consistent Day, Current Streak, Week Complete %
   - Icon + number + label format

### Bottom Navigation
Items: Dashboard (Home icon) • Habits (CheckCircle) • Goals (Target) • Settings (Cog)

### FAB Position
Bottom-right with gap-4 from edges, gap-20 from bottom nav

---

## Copy Tone & Microcopy

### Voice & Personality
The app speaks like a supportive friend - warm, encouraging, and genuinely excited about your progress. Never robotic or clinical.

**Characteristics**:
- **Warm**: Use "you/your" directly, personal and friendly
- **Encouraging**: Celebrate small wins, focus on progress not perfection
- **Playful**: Occasional emojis (🌟 ✨ 🔥 🎉), light metaphors, fun without being childish
- **Positive**: Frame everything as opportunity, not obligation

### Examples by Context

**Headers & Greetings**:
- ❌ "Dashboard" → ✅ "Welcome back, friend! 👋"
- ❌ "Good morning" → ✅ "Good morning, sunshine! ☀️"

**Empty States**:
- ❌ "No habits yet" → ✅ "Ready to build something awesome? ✨"
- ❌ "No goals" → ✅ "What adventure should we start today? 🚀"
- ❌ "No todos" → ✅ "All clear! Time to add your next victory 🌟"

**CTAs & Buttons**:
- ❌ "Create" → ✅ "Start a new habit 🌱"
- ❌ "Add Goal" → ✅ "Dream big 🎯"
- ❌ "Complete" → ✅ "Mark it done! ✓"

**Success Messages**:
- ❌ "Habit logged" → ✅ "Amazing! Keep that momentum going! 🎉"
- ❌ "Goal updated" → ✅ "You're crushing it! 💪"
- ❌ "Todo completed" → ✅ "Victory! You earned it! ✨"

**Error Messages** (Stay encouraging even when things go wrong):
- ❌ "Failed to create habit" → ✅ "Oops! Let's try that again together 💫"
- ❌ "Invalid input" → ✅ "Hmm, that didn't quite work. Mind checking it again? 🤔"

**Streaks & Achievements**:
- "7 day streak - You're on fire! 🔥"
- "First goal complete - Look at you go! 🌟"
- "10 habits this week - Unstoppable! 💪"

### Emoji Usage Guidelines
- Use sparingly - 1-2 per message maximum
- Prefer nature/celebration emojis: 🌟 ✨ 🌱 🔥 🎉 💫 🚀 ☀️ 🌈
- Match emoji to context (plants for growth, fire for streaks, stars for achievements)
- Never use emojis in error states or data labels

---

## Accessibility Standards

- All interactive elements: Minimum 44×44px touch targets
- Focus indicators: 3px ring with offset
- ARIA labels on icon-only buttons
- Form inputs: Associated labels, error states with icons and text
- High contrast ratios maintained in all states
- Keyboard navigation: Full support with visible focus states
- Screen reader: Meaningful descriptions for charts/visualizations
- Reduced motion: Respect prefers-reduced-motion for all animations

---

## Responsive Breakpoints

- **Mobile**: Default (320px - 767px)
- **Tablet**: md: 768px (2-column grid, larger tap targets remain)
- **Desktop**: lg: 1024px (3-column habit lists, hover states enabled)
- **Wide**: xl: 1280px (Max container width, more breathing room)

---

## Visual Elements & Illustrations

### Virtual Pet (Star of the Show)
The virtual pet (adorable orange cat) is the heart of the app and primary visual anchor:
- **Display**: Large, prominent card with gradient background (sunrise)
- **Size**: Generous space (min 280px height on mobile)
- **Context**: Always visible or easily accessible from main navigation
- **Interaction**: Tap to view costume shop, animated reactions to achievements
- **Costumes**: User-purchasable outfits displayed prominently, celebrate customization

### Iconography
- **Style**: Rounded, friendly icons from Lucide React
- **Usage**: Generous padding around icons (p-2 to p-3 in colored backgrounds)
- **Backgrounds**: Soft gradient or solid pastel circles behind icons (rounded-xl to rounded-full)
- **Sizes**: Larger than typical (32px default, 48px for emphasis)

### Decorative Elements
- **Gradients**: Used liberally but tastefully - backgrounds, cards, buttons
- **Soft shapes**: Organic blobs, rounded rectangles, never sharp angles
- **Shadows**: Colored and soft, creating depth without harshness
- **Whitespace**: Generous spacing lets elements breathe

### Data Visualization Style
- **Progress rings**: Soft colors, thick strokes (12-14px), rounded caps
- **Charts**: Rounded bar tops, soft grid lines, pastel fills
- **Heatmaps**: Rounded cells, gentle color scales, soft spacing
- **All visualizations**: Prefer smooth curves over sharp edges

### Custom Illustrations (Future)
- Keep style consistent: simple, rounded, friendly
- Use pastel palette throughout
- Avoid photo-realistic or overly detailed illustrations
- Priority areas: Empty states, achievement celebrations, onboarding