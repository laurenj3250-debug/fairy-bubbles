# GoalConnect Color Palette Reference

This document contains the canonical color palette extracted from `client/src/index.css` for the GoalConnect (Fairy Bubbles) app.

## CSS Custom Properties

### Base Colors

```css
--background: 45 30% 12%;
```
**Deep warm charcoal** - Primary background color for the app. Creates a rich, dark foundation with warm undertones.

**Usage:**
- Main page backgrounds
- Card backgrounds (with opacity): `bg-background/40`
- Overlay backgrounds

---

```css
--foreground: 40 20% 95%;
```
**Bright warm white** - Primary text color. High contrast against the dark background.

**Usage:**
- All primary text
- Secondary text (with opacity): `text-foreground/70`
- Muted text: `text-foreground/50`
- Borders (with opacity): `border-foreground/10`

---

```css
--primary: 25 95% 58%;
```
**BRIGHT sunset orange/gold** - Primary brand color. Energetic and warm.

**Usage:**
- Primary action buttons
- Active states
- Progress indicators
- Gradients (paired with --accent)
- Badges and highlights

---

```css
--secondary: 200 85% 55%;
```
**VIBRANT sky blue** - Secondary brand color. Cool and calming.

**Usage:**
- Secondary actions
- Alternative badges
- Information states
- Accent elements

---

```css
--accent: 160 80% 50%;
```
**ELECTRIC teal/green** - Accent color. Fresh and modern.

**Usage:**
- Highlights
- Hover states
- Interactive elements
- Gradients (paired with --primary)
- Active indicators

---

```css
--success: 142 85% 55%;
```
**BRIGHT neon green** - Success state color.

**Usage:**
- Completed habits
- Success messages
- Positive indicators
- Achievement badges

---

### Semantic Colors

```css
--card: 45 25% 15%;
```
**Slightly lighter than background** - For elevated card elements.

**Usage:**
- Card backgrounds: `bg-card`
- Glass morphism: `bg-card/40 backdrop-blur-xl`

---

```css
--border: 40 15% 25%;
```
**Subtle warm gray** - Default border color.

**Usage:**
- Card borders: `border-border`
- Dividers
- Subtle separators

---

```css
--muted: 40 15% 45%;
```
**Mid-tone gray** - For muted UI elements.

**Usage:**
- Disabled states
- Placeholder text
- Inactive elements

---

```css
--muted-foreground: 40 15% 65%;
```
**Lighter muted** - For muted text.

**Usage:**
- Placeholder text
- Helper text
- Disabled text

---

## Common Gradient Patterns

### Primary-Accent Gradient
```tsx
background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))'
```
**Usage:** Buttons, headers, progress bars, active states

### Horizontal Progress
```tsx
background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)))'
```
**Usage:** Progress bars, loading states

### Subtle Overlay
```tsx
background: 'linear-gradient(135deg, hsl(var(--primary) / 0.1), hsl(var(--accent) / 0.05))'
```
**Usage:** Card overlays, subtle backgrounds

## Opacity Scales

### Background Opacity
- Full: `bg-background` (100%)
- Glass: `bg-background/40` (40%)
- Overlay: `bg-background/60` (60%)
- Subtle: `bg-background/20` (20%)

### Foreground Opacity
- Primary text: `text-foreground` (100%)
- Secondary text: `text-foreground/70` (70%)
- Muted text: `text-foreground/60` (60%)
- Very muted: `text-foreground/50` (50%)
- Disabled: `text-foreground/40` (40%)

### Border Opacity
- Strong: `border-foreground/20` (20%)
- Default: `border-foreground/10` (10%)
- Subtle: `border-foreground/5` (5%)

### Color Opacity (for badges, highlights)
- Background: `/0.15` (15%)
- Border: `/0.5` (50%)
- Solid: `/1` (100%)

## Glass Morphism Standard

**Standard glass card:**
```tsx
className="bg-background/40 backdrop-blur-xl border border-foreground/10 rounded-3xl shadow-xl"
```

**Lighter glass card:**
```tsx
className="bg-card/40 backdrop-blur-md border border-foreground/5 rounded-2xl shadow-lg"
```

## Design Principles

1. **Warm and inviting**: Use the warm charcoal background with warm white text
2. **High energy**: Bright, saturated accent colors (primary, accent, success)
3. **Depth through blur**: Glass morphism with backdrop-blur for layering
4. **Smooth gradients**: Always use primary-accent gradients for vibrancy
5. **Consistent opacity**: Stick to 5%, 10%, 15%, 20%, 40%, 50%, 60%, 70%, 100%
6. **Rounded corners**: Use rounded-2xl (1rem) and rounded-3xl (1.5rem) for modern feel

## Anti-Patterns to Avoid

❌ Hardcoded hex colors: `#ff6b6b`
❌ Hardcoded RGB: `rgb(255, 107, 107)`
❌ Random opacity values: `bg-card/37`
❌ Inconsistent border radius: `rounded-sm` mixed with `rounded-3xl`
❌ Cold colors: Avoid pure blues/grays without warm tints
❌ Low saturation: All accent colors should be vibrant and saturated

## Theme Coherence Checklist

When auditing a component, check:
- [ ] No hardcoded colors (hex, rgb, hsl)
- [ ] Uses CSS custom properties: `hsl(var(--primary))`
- [ ] Glass morphism is consistent: `bg-background/40 backdrop-blur-xl`
- [ ] Gradients follow the pattern: `linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))`
- [ ] Text hierarchy uses consistent opacity: 100%, 70%, 60%, 50%
- [ ] Borders use `border-foreground/10`
- [ ] Rounded corners are consistent: `rounded-2xl` or `rounded-3xl`
- [ ] Success states use `--success` color
- [ ] Interactive elements have hover/active states
- [ ] Shadows are appropriate: `shadow-lg` or `shadow-xl`
