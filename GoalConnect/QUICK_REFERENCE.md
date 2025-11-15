# ⚡ Quick Reference Guide

**TL;DR - The fastest path from idea to deployment**

---

## 🎯 Starting a New Feature

```bash
# 1. Create branch
git checkout -b feature/my-feature

# 2. Build it
npm run dev  # Start dev server

# 3. Check quality
npm run check         # TypeScript
/code-review          # Code quality
/security-review      # Security
npm run test          # Tests

# 4. Ship it
git push
# Create PR on GitHub
```

---

## 🛠️ Common Commands

```bash
# Development
npm run dev              # Start dev server (localhost:5000)
npm run build            # Production build (catches build errors!)
npm run start            # Run production build

# Quality Checks (run BEFORE pushing!)
npm run check            # TypeScript type check
npm run build            # Test production build
npm run test             # Run all Playwright tests
npm run test:ui          # Interactive test UI
npm run test:headed      # See browser while testing
npm run test:debug       # Debug tests step-by-step

# Database
npm run db:push          # Push schema changes
npm run db:migrate       # Run migrations

# Claude Code Workflows
/code-review             # Automated code review
/security-review         # Security vulnerability scan
/design-review           # UI/UX review
```

---

## 📁 Project Structure

```
GoalConnect/
├── client/src/
│   ├── components/          # UI components
│   │   ├── ui/             # Base components (Button, Card, etc)
│   │   ├── *Card.tsx       # Dashboard cards
│   │   └── *.tsx           # Feature components
│   ├── pages/              # Route pages
│   ├── lib/                # Utilities
│   ├── themes/             # Theme config
│   └── index.css           # Global styles
│
├── server/
│   ├── routes.ts           # API endpoints
│   ├── db-storage.ts       # Database queries
│   └── index.ts            # Server entry
│
├── shared/
│   └── schema.ts           # Database schema (Drizzle)
│
├── tests/                  # Playwright E2E tests
└── .claude/commands/       # Slash commands
```

---

## 🎨 Component Patterns

### Creating a New Glass Card

```tsx
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from "@/components/ui/GlassCard";

export function MyCard() {
  return (
    <GlassCard opacity={75} blur="md">
      <GlassCardHeader>
        <GlassCardTitle>My Card</GlassCardTitle>
      </GlassCardHeader>

      <GlassCardContent>
        {/* Your content */}
      </GlassCardContent>
    </GlassCard>
  );
}
```

### Using Theme Colors

```tsx
// ✅ DO: Use theme variables
className="text-primary bg-primary/20 border-primary"

// ❌ DON'T: Use hardcoded colors
className="text-orange-500 bg-orange-100 border-orange-300"
```

### Adding Accessibility

```tsx
<button
  aria-label="Complete habit"
  aria-pressed={isCompleted}
  className="focus-visible:ring-2 focus-visible:ring-primary"
>
  {/* ... */}
</button>
```

---

## 🧪 Testing Patterns

### Writing a Playwright Test

```typescript
import { test, expect } from '@playwright/test';

test('user can complete a habit', async ({ page }) => {
  // 1. Navigate
  await page.goto('/');

  // 2. Interact
  await page.getByRole('button', { name: 'ANKI' }).click();

  // 3. Assert
  await expect(page.getByRole('button', { name: 'ANKI' })).toHaveClass(/bg-primary/);
});
```

---

## 🚨 Troubleshooting

### TypeScript Errors

```bash
# Check what's wrong
npm run check

# Common fixes:
# 1. Missing import
import type { Habit } from "@shared/schema";

# 2. Wrong type
const [count, setCount] = useState<number>(0);

# 3. Null handling
const value = data?.field ?? defaultValue;
```

### Tests Failing

```bash
# Debug interactively
npm run test:debug

# See what Playwright sees
npm run test:headed

# Check specific test
npx playwright test habits.spec.ts
```

### Dev Server Won't Start

```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install

# Check ports
lsof -i :5000  # Is port in use?
pkill -f "node.*5000"  # Kill it
```

### Database Issues

```bash
# Reset database
npm run db:push

# Check connection
psql -h localhost -U postgres -d neuronode
```

---

## 📚 Quick Links

- **Workflow Guide**: [DEVELOPMENT_WORKFLOW.md](./DEVELOPMENT_WORKFLOW.md)
- **Workflows**: [WORKFLOWS.md](./WORKFLOWS.md)
- **Component Map**: [COMPONENT_MAP.md](./COMPONENT_MAP.md)
- **Design Principles**: [design-principles.md](./design-principles.md)

---

## 💡 Pro Tips

1. **Use VS Code snippets** for common patterns
2. **Keep dev server running** while coding
3. **Test early, test often** - don't wait until the end
4. **Small commits** - easier to debug and revert
5. **Read error messages** - they usually tell you what's wrong

---

**Need help? Just type `/claude` and ask!**
