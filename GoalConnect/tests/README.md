# GoalConnect E2E Tests

Playwright end-to-end tests for the Base Camp climbing habit tracker.

## Running Tests

```bash
# Run all tests (headless)
npm test

# Run with UI mode (interactive)
npm run test:ui

# Run in headed mode (see browser)
npm run test:headed

# Debug mode (step through tests)
npm run test:debug

# View last test report
npm run test:report
```

## Test Files

- **`example.spec.ts`** - Basic smoke tests to verify Playwright is working
- **`dashboard.spec.ts`** - Tests for the Base Camp dashboard layout and components
- **`habits.spec.ts`** - Tests for habit tracking, completion, and streak updates
- **`goals.spec.ts`** - Tests for goal progress and visualizations
- **`dream-scroll.spec.ts`** - Tests for Dream Scroll integration with Looking Forward card

## Test Coverage

### Dashboard Components
- ✅ Mountain Hero Card (El Capitan expedition display)
- ✅ Today Card (habit pills and tasks)
- ✅ Week Overview Card (M-S activity strip with modal)
- ✅ Goals Card (dual visualization: segments & dots)
- ✅ Looking Forward Card (Dream Scroll integration)
- ✅ Peak Lore Card (daily climbing inspiration)
- ✅ Little Wins Strip (achievement pills)

### User Interactions
- ✅ Toggle habit completion
- ✅ View week detail modal
- ✅ Check goal progress visualizations
- ✅ Add items to Looking Forward list

### Responsive Design
- ✅ 1440×900 (target desktop resolution)
- ✅ Mobile/tablet viewports

## Writing New Tests

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: login, navigate, etc.
    await page.goto('/');
  });

  test('descriptive test name', async ({ page }) => {
    // Arrange
    const element = page.getByRole('button', { name: 'Click me' });

    // Act
    await element.click();

    // Assert
    await expect(page.getByText('Success!')).toBeVisible();
  });
});
```

## Configuration

See `playwright.config.ts` for:
- Browser configurations (Chrome, Firefox, Safari)
- Viewport sizes
- Screenshots/videos on failure
- Dev server auto-start

## CI/CD Integration

Tests automatically run on CI with:
- Retry on failure (2x)
- Video/screenshot capture
- HTML report generation

## Debugging Tips

1. **Use UI mode** for interactive debugging:
   ```bash
   npm run test:ui
   ```

2. **Step through tests** with debug mode:
   ```bash
   npm run test:debug
   ```

3. **Check screenshots** in `test-results/` folder after failures

4. **Use Playwright Inspector** to record new tests:
   ```bash
   npx playwright codegen http://localhost:5000
   ```

## TODO: Add Authentication

Currently tests assume logged-in state. Add proper authentication flow:

```typescript
// Example auth helper
async function login(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Login' }).click();
  await page.waitForURL('/');
}
```
