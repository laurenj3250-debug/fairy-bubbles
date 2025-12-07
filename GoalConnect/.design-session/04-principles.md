# F4: Design Principles - The Minimal-Lauren Layout™

## Visual System

### Color Palette (ONE accent - Teal)
```
Primary Accent:  #00D4AA (teal) - completions, progress, active states
Background:      #0d1117 (deep charcoal)
Card:            #161b22 (elevated surface)
Border:          #30363d (subtle separation)
Text Primary:    #e6edf3 (bright)
Text Secondary:  #7d8590 (muted)
Success:         #238636 (completed items)
Warning:         #f59e0b (streak at risk)
Urgent:          #f85149 (overdue)
```

### Typography
```
Headings:   Inter 600, 14-16px
Body:       Inter 400, 13-14px  
Small:      Inter 400, 11-12px
Mono:       JetBrains Mono (clock, stats)
```

### Spacing Scale (8px base)
```
xs:  4px   (inline spacing)
sm:  8px   (element gaps)
md:  16px  (card padding, section gaps)
lg:  24px  (major sections)
xl:  32px  (row separation)
```

### Border Radius
```
Cards:     12px
Buttons:   8px
Tags:      6px
Circles:   9999px
```

---

## Layout Structure

### Grid
```
| 3 cards (equal) |  → Top row: flex, gap-16px
| CALENDAR        |  → Middle: flex-1, min-height 50vh
| widgets (opt)   |  → Bottom: flex, gap-16px, conditional
```

### Measurements
- **Header**: 56px fixed height
- **Top Row Cards**: ~200px height each, equal width (1/3)
- **Calendar**: Fills remaining space (flex-1)
- **Widget Row**: ~120px height when visible
- **Total max boxes**: 6 (3 top + calendar + 2 optional)

---

## Component Styles

### Cards
```css
.card {
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 12px;
  padding: 16px;
}
```

### Today Column Highlight
```css
.today {
  background: linear-gradient(180deg, rgba(0,212,170,0.08), transparent);
  border: 1px solid rgba(0,212,170,0.3);
  box-shadow: 0 0 0 1px rgba(0,212,170,0.1);
}
```

### Task Items
```css
.task {
  background: #21262d;
  border: 1px solid #30363d;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 12px;
}

.task-done {
  background: rgba(35, 134, 54, 0.1);
  border-color: rgba(35, 134, 54, 0.3);
  text-decoration: line-through;
  opacity: 0.6;
}

.task-urgent {
  border-left: 3px solid #f85149;
  background: rgba(248, 81, 73, 0.08);
}
```

### Progress Bars
```css
.progress-bar {
  height: 6px;
  background: #30363d;
  border-radius: 3px;
}

.progress-fill {
  background: #00D4AA;
  border-radius: 3px;
  transition: width 300ms ease;
}
```

---

## Interaction Patterns

### Hover States
- Cards: `background: #1c2128` (slightly lighter)
- Tasks: `border-color: #484f58`
- Buttons: `background: hsl(accent/80%)`

### Transitions
- All: `200ms ease`
- No bouncy animations
- Smooth opacity fades

### Focus States
- `outline: 2px solid #00D4AA`
- `outline-offset: 2px`

---

## Widget Visibility Rules

### Auto-Hide Conditions
```typescript
// Widget only renders if:
if (widget.data.length > 0) render()

// Smooth exit
<AnimatePresence>
  {hasData && <motion.div exit={{ opacity: 0, height: 0 }} />}
</AnimatePresence>
```

### Empty States
- Don't show empty cards
- Don't show placeholder text
- Just hide the widget entirely

---

## ADHD-Friendly Rules

1. **Max 5 habits visible** (no infinite scrolling)
2. **Max 3-5 tasks per day column**
3. **Today auto-expanded** by default
4. **Streak warnings pulse** (subtle animation)
5. **Completed items fade** (not removed, just dimmed)
6. **ONE primary action** per card
7. **No notifications/alerts** inside dashboard

---

## Mood Check

✅ Clean - no visual clutter
✅ Functional - everything has purpose
✅ ADHD-friendly - limited choices, clear focus
✅ NOT a neon panic attack
✅ NOT a cluttered break room
