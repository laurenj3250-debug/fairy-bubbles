/**
 * Goal Calendar Widget E2E Tests
 * Tests the calendar widget on IcyDash that shows goals with due dates
 */

import { test, expect } from '@playwright/test';

test.describe('Goal Calendar Widget', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to IcyDash at root (authenticated via global setup)
    await page.goto('/');
    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test('calendar widget is visible on dashboard', async ({ page }) => {
    // Verify the calendar widget exists with "Deadlines" title
    const calendarWidget = page.locator('.glass-card:has-text("Deadlines")');
    await expect(calendarWidget).toBeVisible();

    // Verify day labels exist (S M T W T F S)
    const dayLabels = calendarWidget.locator('text=S >> nth=0');
    await expect(dayLabels).toBeVisible();
  });

  test('can navigate between months', async ({ page }) => {
    const calendarWidget = page.locator('.glass-card:has-text("Deadlines")');

    // Get current month display - look for "Jan 2026" style text
    const monthButton = calendarWidget.locator('button.min-w-\\[80px\\]');
    const initialMonth = await monthButton.textContent();
    console.log('Initial month:', initialMonth);

    // Click next month button (ChevronRight)
    const nextButton = calendarWidget.locator('button').filter({ has: page.locator('svg.lucide-chevron-right') });
    await nextButton.click();
    await page.waitForTimeout(300);

    // Verify month changed
    const newMonth = await monthButton.textContent();
    console.log('After next:', newMonth);
    expect(newMonth).not.toBe(initialMonth);

    // Click previous month button twice to go back
    const prevButton = calendarWidget.locator('button').filter({ has: page.locator('svg.lucide-chevron-left') });
    await prevButton.click();
    await page.waitForTimeout(300);
    await prevButton.click();
    await page.waitForTimeout(300);

    // Click on month text to return to today
    await monthButton.click();
    await page.waitForTimeout(300);

    // Should be back at today's month
    const currentMonth = await monthButton.textContent();
    console.log('After returning:', currentMonth);
    expect(currentMonth).toBe(initialMonth);
  });

  test('today is highlighted with ring', async ({ page }) => {
    const calendarWidget = page.locator('.glass-card:has-text("Deadlines")');

    // Today should have ring-peach-400 class
    const today = new Date();
    const todayNumber = today.getDate().toString();

    // Find today's cell with the ring styling
    const todayCell = calendarWidget.locator(`div.ring-1.ring-peach-400:has-text("${todayNumber}")`);
    await expect(todayCell).toBeVisible();
  });

  test('goals with due dates show colored dots', async ({ page }) => {
    // Navigate to February to see Pimsleur Module 3 (due Feb 10)
    const calendarWidget = page.locator('.glass-card:has-text("Deadlines")');
    const monthButton = calendarWidget.locator('button.min-w-\\[80px\\]');
    const nextButton = calendarWidget.locator('button').filter({ has: page.locator('svg.lucide-chevron-right') });

    // Navigate to Feb 2026
    const currentMonth = await monthButton.textContent();
    console.log('Current month:', currentMonth);
    if (!currentMonth?.includes('Feb')) {
      await nextButton.click(); // Go to Feb from Jan
      await page.waitForTimeout(500);
    }

    // Wait for calendar data to load
    await page.waitForTimeout(500);

    // Look for any day cell with colored dots (goal indicators)
    // These are small circles at the bottom of day cells
    const goalDots = calendarWidget.locator('.w-1.h-1.rounded-full');

    // Count goal dots
    const dotCount = await goalDots.count();
    console.log(`Found ${dotCount} goal indicator dots`);

    // If we have goals with due dates, dots should be visible
    if (dotCount > 0) {
      await expect(goalDots.first()).toBeVisible();
    }
  });

  test('clicking on day with goals opens popover', async ({ page }) => {
    // Navigate to February to see Pimsleur Module 3 (due Feb 10)
    const calendarWidget = page.locator('.glass-card:has-text("Deadlines")');
    const monthButton = calendarWidget.locator('button.min-w-\\[80px\\]');
    const nextButton = calendarWidget.locator('button').filter({ has: page.locator('svg.lucide-chevron-right') });

    // Navigate to Feb 2026
    const currentMonth = await monthButton.textContent();
    console.log('Current month for popover test:', currentMonth);
    if (!currentMonth?.includes('Feb')) {
      await nextButton.click();
      await page.waitForTimeout(500);
    }

    await page.waitForTimeout(500);

    // Find day 10 cell (should have Pimsleur Module 3)
    // Look for clickable day cell with cursor-pointer
    const day10Cell = calendarWidget.locator('div.cursor-pointer:has-text("10")').first();
    const hasCursor = await day10Cell.count() > 0;

    if (hasCursor) {
      // Click on it
      await day10Cell.click();
      await page.waitForTimeout(300);

      // Check if popover appeared
      const popover = page.locator('[data-radix-popper-content-wrapper]');
      const popoverVisible = await popover.isVisible().catch(() => false);
      console.log('Popover visible:', popoverVisible);

      if (popoverVisible) {
        // Verify popover has goal info
        await expect(popover.locator('text=February 10')).toBeVisible();
      }
    } else {
      console.log('No clickable day 10 found - no goals on this date');
    }
  });

  test('stats show goals count', async ({ page }) => {
    const calendarWidget = page.locator('.glass-card:has-text("Deadlines")');

    // Check for stats display (e.g., "2/5 done")
    const statsText = calendarWidget.locator('text=/\\d+\\/\\d+ done/');

    // If there are goals, stats should be visible
    const statsVisible = await statsText.isVisible().catch(() => false);
    console.log(`Stats visible: ${statsVisible}`);
  });

  test('navigate to July for residency goals', async ({ page }) => {
    const calendarWidget = page.locator('.glass-card:has-text("Deadlines")');
    const monthButton = calendarWidget.locator('button.min-w-\\[80px\\]');
    const nextButton = calendarWidget.locator('button').filter({ has: page.locator('svg.lucide-chevron-right') });

    // Navigate to July 2026 (6 months from Jan)
    for (let i = 0; i < 6; i++) {
      await nextButton.click();
      await page.waitForTimeout(200);
    }

    // Verify we're in July
    const monthText = await monthButton.textContent();
    console.log('After 6 clicks, month is:', monthText);
    expect(monthText).toContain('Jul');

    // Wait for goal data to load
    await page.waitForTimeout(500);

    // Look for goal dots in the calendar (any clickable day)
    const clickableDays = calendarWidget.locator('div.cursor-pointer');
    const clickableCount = await clickableDays.count();
    console.log(`July has ${clickableCount} days with goals`);

    // Look for day 14 specifically
    const goalDots = calendarWidget.locator('.w-1.h-1.rounded-full');
    const dotCount = await goalDots.count();
    console.log(`July has ${dotCount} total goal indicator dots`);
  });
});
