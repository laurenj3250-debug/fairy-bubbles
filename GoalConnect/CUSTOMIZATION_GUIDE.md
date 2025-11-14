# Fairy Bubbles Customization Guide

Welcome! This guide will show you how to easily customize your habit tracker's appearance. The redesign makes changes **10x easier** than before.

## 🎨 Quick Overview

All visual customization is now centralized in **ONE place**:
```
/client/src/themes/config.ts
```

No more hunting through 1,518 lines of CSS! Everything you need is in this single, well-organized file.

---

## 📖 Table of Contents

1. [Changing Color Themes](#changing-color-themes)
2. [Adding New Mountain Backgrounds](#adding-new-mountain-backgrounds)
3. [Adjusting Spacing & Effects](#adjusting-spacing--effects)
4. [Creating Your Own Theme](#creating-your-own-theme)
5. [Common Customizations](#common-customizations)

---

## Changing Color Themes

### Switch Between Existing Themes

Open `/client/src/themes/config.ts` and you'll see three pre-built themes:

1. **Light Mountain** (default) - Clean, bright, sky blues
2. **Sunset Peak** - Warm oranges and pinks
3. **Alpine Clean** - Crisp whites and ice blues

To change themes, edit the CSS variables in `/client/src/index.css` at line 26:

```css
:root {
  /* Change these values to match your desired theme */
  --background: 0 0% 100%;
  --foreground: 222 47% 11%;
  /* ... etc */
}
```

Or use the `applyTheme()` function programmatically:

```typescript
import { applyTheme } from '@/themes/config';

// In your component
useEffect(() => {
  applyTheme('sunsetPeak'); // or 'alpineClean', 'lightMountain'
}, []);
```

---

## Adding New Mountain Backgrounds

### Step 1: Add Your Image

Place your mountain image in:
```
/client/public/backgrounds/your-image.jpg
```

### Step 2: Register the Background

Edit `/client/src/themes/config.ts`:

```typescript
export const backgrounds: BackgroundConfig[] = [
  // ... existing backgrounds ...

  // Add your new one:
  {
    id: 'my-mountain',
    name: 'My Favorite Peak',
    image: '/backgrounds/your-image.jpg',
    unlockStreak: 500,  // Days needed to unlock
    description: 'You reached 500 days!',
    timeOfDay: 'sunset'  // Optional: 'dawn', 'day', 'sunset', 'night'
  }
];
```

That's it! Your background will now automatically show when the user reaches a 500-day streak.

---

## Adjusting Spacing & Effects

### Change Card Padding

In `/client/src/themes/config.ts`, find your theme (e.g., `lightMountainTheme`):

```typescript
spacing: {
  sectionGap: '1.5rem',   // Space between sections
  cardPadding: '1.5rem',  // Padding inside cards
  borderRadius: '0.75rem' // Card corner roundness
}
```

Change the values and save. All cards update instantly!

### Change Hover Effects

```typescript
effects: {
  cardShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
  hoverScale: 1.02,      // How much cards grow on hover (1.0 = no growth)
  transitionSpeed: '150ms' // Animation speed
}
```

---

## Creating Your Own Theme

### Step 1: Copy an Existing Theme

In `/client/src/themes/config.ts`, duplicate one of the existing themes:

```typescript
export const myCustomTheme: Theme = {
  name: 'My Custom Theme',
  colors: {
    // Base colors
    background: '0 0% 100%',           // HSL format (Hue Saturation Lightness)
    foreground: '222 47% 11%',
    card: '0 0% 98%',
    cardForeground: '222 47% 11%',

    // Primary color (buttons, links, focus states)
    primary: '199 89% 48%',
    primaryForeground: '0 0% 100%',

    // ... customize all colors ...
  },
  spacing: { /* ... */ },
  effects: { /* ... */ }
};
```

### Step 2: Register Your Theme

Add it to the themes registry:

```typescript
export const themes = {
  lightMountain: lightMountainTheme,
  sunsetPeak: sunsetPeakTheme,
  alpineClean: alpineCleanTheme,
  myCustom: myCustomTheme,  // ← Add here
};
```

### Step 3: Apply Your Theme

```typescript
applyTheme('myCustom');
```

---

## Common Customizations

### Make Text Darker

```typescript
colors: {
  foreground: '222 47% 5%',  // Lower lightness = darker (was 11%)
}
```

### Change Success Color (Completed Habits)

```typescript
colors: {
  success: '142 71% 45%',  // Default green
  // Try: '200 89% 48%' for blue
  // Try: '340 82% 52%' for pink
}
```

### Make Cards Flatter (Less Shadow)

```typescript
effects: {
  cardShadow: 'none',  // No shadow at all
  // Or: '0 1px 2px 0 rgb(0 0 0 / 0.05)' for subtle shadow
}
```

### Increase Spacing Between Sections

```typescript
spacing: {
  sectionGap: '2.5rem',  // Default is 1.5rem
}
```

### Change Streak Fire Color

The streak uses the `accent` color:

```typescript
colors: {
  accent: '25 95% 53%',  // Default warm orange
  // Try: '340 82% 52%' for pink
  // Try: '280 89% 48%' for purple
}
```

---

## 🎨 Color Format (HSL)

Colors use the HSL format: `Hue Saturation Lightness`

- **Hue** (0-360): The color itself
  - 0 = Red
  - 30 = Orange
  - 60 = Yellow
  - 120 = Green
  - 200 = Blue
  - 280 = Purple
  - 340 = Pink

- **Saturation** (0-100%): How vibrant
  - 0% = Grayscale
  - 100% = Full color

- **Lightness** (0-100%): How bright
  - 0% = Black
  - 50% = True color
  - 100% = White

**Example:** `199 89% 48%` = Blue (199°) that's very vibrant (89%) and medium brightness (48%)

---

## 🔧 Troubleshooting

### Changes Not Showing?

1. Save the file
2. Refresh your browser (Cmd/Ctrl + Shift + R for hard refresh)
3. Check browser console for errors

### Colors Look Wrong?

- Make sure you're using HSL format (not RGB or hex)
- HSL values should be: `hue saturation% lightness%`
- Example: `200 89% 48%` (note: no `hsl()` wrapper, just the values)

### Want to Revert to Original?

The original CSS is backed up at:
```
/client/src/index.css.backup
```

---

## 📚 Additional Resources

- **Theme Config:** `/client/src/themes/config.ts`
- **CSS Variables:** `/client/src/index.css` (lines 25-58)
- **Components:**
  - Daily Focus: `/client/src/components/DailyFocusHero.tsx`
  - Week/Streak: `/client/src/components/WeekOverviewStreak.tsx`
  - Goals: `/client/src/components/GoalsSection.tsx`
  - Background: `/client/src/components/ProgressBackground.tsx`

---

## 💡 Tips

1. **Start Small:** Change one color at a time and see how it looks
2. **Use Contrast Checkers:** Ensure text is readable on backgrounds
3. **Test on Mobile:** Responsive design matters!
4. **Keep Backups:** Copy themes before making big changes

---

## 🎉 What Changed in the Redesign?

### Before (Old System):
- ❌ 1,518 lines of complex CSS
- ❌ Time-of-day gradients, weather effects, parallax
- ❌ Changes break things 5+ times before working
- ❌ Hard to find where specific elements are styled

### After (New System):
- ✅ ~330 lines of clean CSS (78% reduction!)
- ✅ All customization in ONE file (`themes/config.ts`)
- ✅ Change colors in one place, updates everywhere
- ✅ Clear component structure, easy to modify
- ✅ Built-in documentation and comments

---

## Need Help?

If you run into issues or want to add features, the codebase is now **much easier to work with**. Each component has clear comments explaining what it does, and the theme system is self-documenting.

Happy customizing! 🎨✨
