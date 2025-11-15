---
allowed-tools: Bash, Read, Grep, Glob
description: Capture visual screenshots of the app and analyze them
---

# Visual Check Workflow

You are performing a visual check of the application to verify it looks correct.

## Step 1: Capture Screenshot with Playwright

Run Playwright to capture a fresh screenshot of the current state:

```bash
npm run test -- --grep "displays mountain hero" --headed
```

## Step 2: Find and Read the Screenshot

```bash
# Find the most recent screenshot
ls -lt test-results/**/*.png | head -1 | awk '{print $NF}'
```

Then READ that screenshot file to see what's actually rendering.

## Step 3: Analyze What You See

Compare the screenshot to the design requirements:

**Expected (Base Camp Dashboard):**
- Light warm sunrise background (orange/yellow gradient)
- Glassmorphism cards (semi-transparent with backdrop-blur)
- Mountain Hero at top with El Capitan
- Today card, Week Overview, Goals card
- Looking Forward, Peak Lore, Little Wins
- Proper spacing and layout

**Check for issues:**
- ❌ Dark background instead of light?
- ❌ Solid cards instead of glassmorphism?
- ❌ Missing components?
- ❌ Layout problems?
- ❌ Wasted space?

## Step 4: Report Findings

List all visual issues found with specific details:
1. Issue name
2. What's wrong
3. What it should be
4. How to fix it

## Step 5: Fix Critical Issues

Fix the top 3 most critical visual issues immediately.
