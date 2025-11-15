# Playwright Authentication Guide

Complete guide for using Playwright with authentication in GoalConnect.

## Quick Start

### 1. Run Tests with Authentication

```bash
# Run all tests (auth setup runs automatically first)
npm test

# Run with UI mode
npm run test:ui

# Run in headed mode (see the browser)
npm run test:headed

# Debug mode (step through tests)
npm run test:debug
```

### 2. Browse Your App with Authentication

```bash
# Desktop view with codegen (interactive browser)
npm run browse

# Mobile view
npm run browse:mobile

# Tablet view
npm run browse:tablet

# Custom viewport
./scripts/browse-authenticated.sh codegen 1920,1080
```

### 3. Take Screenshots of All Pages

```bash
# Capture all pages at different viewports
npm run screenshot
```

## Authentication Setup

### How It Works

1. **Setup Project**: The `setup` project runs first (defined in `playwright.config.ts`)
2. **Auth Setup File**: `tests/auth.setup.ts` logs in and saves the session
3. **Session Storage**: Saved to `playwright/.auth/user.json`
4. **Tests Use Session**: All tests load the saved session automatically

### Test Credentials

Default test user:
- Email: `playwright-test@test.com`
- Password: `testpass123`

The auth setup will:
- Try to log in with these credentials
- If login fails, it registers a new account
- Saves the session for reuse

### Manual Setup

If you need to re-authenticate:

```bash
# Run just the auth setup
npx playwright test tests/auth.setup.ts

# Or delete the saved session to force re-auth
rm -rf playwright/.auth/user.json
```

## Using the Browse Script

The `browse-authenticated.sh` script is a helper for common Playwright tasks.

### Modes

#### Codegen Mode (Interactive Browser)
```bash
npm run browse
# or
./scripts/browse-authenticated.sh codegen
```

Opens an interactive browser with your saved authentication. You can:
- Click around the app
- See generated Playwright code
- Use the inspector to explore elements

#### Debug Mode
```bash
./scripts/browse-authenticated.sh debug
```

Runs tests in debug mode with step-through capabilities.

#### Headed Mode
```bash
./scripts/browse-authenticated.sh headed
```

Runs tests with visible browser (not headless).

#### UI Mode
```bash
./scripts/browse-authenticated.sh ui
```

Opens Playwright UI for interactive test running.

#### Screenshot Mode
```bash
./scripts/browse-authenticated.sh screenshot
# or
npm run screenshot
```

Takes screenshots of all defined pages.

### Viewports

Available viewport presets:

```bash
# Desktop (1440x900) - default
npm run browse

# Tablet (768x1024)
npm run browse:tablet

# Mobile (375x667)
npm run browse:mobile

# Custom (width x height)
./scripts/browse-authenticated.sh codegen 1920,1080
```

## Screenshot Script

The screenshot script (`scripts/screenshot-all-pages.ts`) captures all pages at multiple viewports.

### Configuration

Edit `scripts/screenshot-all-pages.ts` to add pages:

```typescript
const PAGES_TO_SCREENSHOT = [
  { name: 'home', url: '/', viewports: ['desktop', 'mobile'] },
  { name: 'habits', url: '/habits', viewports: ['desktop', 'mobile', 'tablet'] },
  { name: 'goals', url: '/goals', viewports: ['desktop'] },
  // Add more pages...
];
```

### Output

Screenshots are saved to `screenshots/` directory:
- `home-desktop.png`
- `home-mobile.png`
- `habits-tablet.png`
- etc.

### Usage

```bash
# Take all screenshots
npm run screenshot

# View screenshots
open screenshots/
```

## Writing Tests with Authentication

All tests automatically use the saved authentication. Just write your tests normally:

```typescript
import { test, expect } from '@playwright/test';

test('view habits page', async ({ page }) => {
  // Already authenticated! Just navigate
  await page.goto('/habits');

  // Assert what you need
  await expect(page.getByText('My Habits')).toBeVisible();
});
```

### Testing Logged-Out Behavior

If you need to test logged-out behavior, create a test without the `storageState`:

```typescript
test.use({ storageState: { cookies: [], origins: [] } });

test('redirect to login when not authenticated', async ({ page }) => {
  await page.goto('/habits');
  await expect(page).toHaveURL('/login');
});
```

## Playwright Config Overview

Key sections in `playwright.config.ts`:

### Setup Project
```typescript
{
  name: 'setup',
  testMatch: /.*\.setup\.ts/,
}
```

Runs before all other tests to authenticate.

### Test Projects with Auth
```typescript
{
  name: 'chromium',
  use: {
    ...devices['Desktop Chrome'],
    storageState: 'playwright/.auth/user.json', // Load saved session
  },
  dependencies: ['setup'], // Run setup first
}
```

All browser projects load the saved session.

### Base URL
```typescript
use: {
  baseURL: 'http://localhost:5000',
}
```

Allows using relative URLs in tests: `await page.goto('/')`.

## Troubleshooting

### "No user in session" errors

The auth session may have expired. Re-run setup:
```bash
rm -rf playwright/.auth/user.json
npx playwright test tests/auth.setup.ts
```

### Server not starting

Make sure your dev server is running:
```bash
npm run dev
```

Or use the web server config in `playwright.config.ts` (already configured).

### Authentication keeps failing

Check the test credentials match your database:
- Email: `playwright-test@test.com`
- Password: `testpass123`

Or update `tests/auth.setup.ts` with different credentials.

### Screenshots are blank

Make sure the page has loaded before taking screenshot. The script already includes `waitUntil: 'networkidle'` and a 1-second delay.

## CI/CD Integration

For CI environments, the setup runs automatically:

```yaml
# Example GitHub Actions
- name: Install Playwright
  run: npx playwright install --with-deps

- name: Run tests
  run: npm test
```

The setup project will create a new test user and authenticate on each CI run.

## Advanced Usage

### Multiple User Sessions

To test with different users, create multiple auth files:

```typescript
// tests/auth-admin.setup.ts
const authFile = 'playwright/.auth/admin.json';
// ... login as admin

// tests/auth-user.setup.ts
const authFile = 'playwright/.auth/user.json';
// ... login as regular user
```

Then use different `storageState` in tests:

```typescript
test.use({ storageState: 'playwright/.auth/admin.json' });
```

### Custom Viewports

Add custom viewports in the script or config:

```typescript
const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  ultrawide: { width: 2560, height: 1440 },
  // ... add more
};
```

## Resources

- [Playwright Auth Documentation](https://playwright.dev/docs/auth)
- [Playwright Codegen](https://playwright.dev/docs/codegen-intro)
- [Playwright Test Configuration](https://playwright.dev/docs/test-configuration)
