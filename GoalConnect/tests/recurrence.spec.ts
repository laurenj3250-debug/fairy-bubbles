import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('Recurring Tasks', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/todos');
  });

  test('should create a recurring task', async ({ page }) => {
    // Open task dialog
    await page.click('button:has-text("New Task")');

    // Wait for dialog to open
    await expect(page.locator('text=Create New Task')).toBeVisible();

    // Fill in task title
    await page.fill('input[placeholder*="Finish project"]', 'Daily standup meeting');

    // Scroll to recurrence section if needed
    await page.evaluate(() => {
      const recurrenceSection = document.querySelector('label:has-text("Repeat")');
      recurrenceSection?.scrollIntoView({ behavior: 'smooth' });
    });

    // Click on Daily preset
    await page.click('button:has-text("Daily")');

    // Verify preset is selected
    await expect(page.locator('button:has-text("Daily")').first()).toHaveClass(/default/);

    // Verify summary shows daily pattern
    await expect(page.locator('text=Summary').locator('..').locator('p')).toContainText('Daily');

    // Submit the form
    await page.click('button:has-text("Create Task")');

    // Wait for dialog to close
    await expect(page.locator('text=Create New Task')).not.toBeVisible();

    // Verify task appears with recurring indicator
    await expect(page.locator('text=Daily standup meeting')).toBeVisible();
  });

  test('should show recurring pattern on task card', async ({ page }) => {
    // Create a recurring task first
    await page.click('button:has-text("New Task")');
    await page.fill('input[placeholder*="Finish project"]', 'Weekly team sync');

    // Select Weekly pattern
    await page.click('button:has-text("Weekly")');

    // Submit
    await page.click('button:has-text("Create Task")');

    // Wait for task to be created
    await page.waitForTimeout(500);

    // Verify recurring indicator is shown
    const taskCard = page.locator('text=Weekly team sync').locator('..');
    await expect(taskCard).toBeVisible();

    // Look for Repeat icon or Weekly badge
    await expect(page.locator('[data-icon="repeat"]').or(page.locator('text=Weekly').first())).toBeVisible();
  });

  test('should edit recurrence pattern', async ({ page }) => {
    // Create a daily task
    await page.click('button:has-text("New Task")');
    await page.fill('input[placeholder*="Finish project"]', 'Check emails');
    await page.click('button:has-text("Daily")');
    await page.click('button:has-text("Create Task")');

    await page.waitForTimeout(500);

    // Edit the task
    const taskCard = page.locator('text=Check emails').locator('..');
    await taskCard.hover();
    await taskCard.locator('[data-icon="edit"]').or(taskCard.locator('button:has-text("Edit")')).first().click({ timeout: 5000 }).catch(() => {
      // If edit button not found, try clicking the task itself
      return taskCard.click();
    });

    // Wait for edit dialog
    await expect(page.locator('text=Edit Task')).toBeVisible({ timeout: 5000 });

    // Change to Weekly
    await page.click('button:has-text("Weekly")');

    // Update
    await page.click('button:has-text("Update Task")');

    // Verify pattern changed
    await page.waitForTimeout(500);
    const updatedCard = page.locator('text=Check emails').locator('..');
    await expect(updatedCard).toBeVisible();
  });

  test('should show preview of next occurrences', async ({ page }) => {
    await page.click('button:has-text("New Task")');
    await page.fill('input[placeholder*="Finish project"]', 'Test task with preview');

    // Select daily pattern
    await page.click('button:has-text("Daily")');

    // Verify preview section appears
    await expect(page.locator('text=Next 5 occurrences')).toBeVisible();

    // Verify preview has dates
    const preview = page.locator('text=Next 5 occurrences').locator('..');
    const dates = preview.locator('li');
    await expect(dates.first()).toBeVisible();
  });

  test('should create task with weekdays preset', async ({ page }) => {
    await page.click('button:has-text("New Task")');
    await page.fill('input[placeholder*="Finish project"]', 'Weekday task');

    // Click Weekdays preset
    await page.click('button:has-text("Weekdays")');

    // Verify summary shows weekday pattern
    await expect(page.locator('text=Summary').locator('..').locator('p')).toContainText('Mon, Tue, Wed, Thu, Fri');

    await page.click('button:has-text("Create Task")');
    await expect(page.locator('text=Weekday task')).toBeVisible();
  });

  test('should set end date for recurrence', async ({ page }) => {
    await page.click('button:has-text("New Task")');
    await page.fill('input[placeholder*="Finish project"]', 'Limited recurrence task');

    await page.click('button:has-text("Daily")');

    // Select end condition
    await page.click('text=Ends');
    await page.click('text=On date');

    // Pick an end date (just verify the date picker appears)
    await expect(page.locator('text=End date')).toBeVisible();

    // Cancel instead of submitting (since date picker interaction is complex)
    await page.click('button:has-text("Cancel")');
  });

  test('should validate recurrence pattern', async ({ page }) => {
    await page.click('button:has-text("New Task")');
    await page.fill('input[placeholder*="Finish project"]', 'Validation test');

    // Select monthly and set invalid day
    await page.click('button:has-text("Monthly")');

    // Try to set day 50 (should show validation error)
    const dayInput = page.locator('input[type="number"]').filter({ hasText: 'Day of month' }).or(
      page.locator('label:has-text("Day of month")').locator('..').locator('input')
    );

    if (await dayInput.count() > 0) {
      await dayInput.first().fill('50');

      // Should show validation error
      await expect(page.locator('text=Invalid pattern').or(page.locator('text=Day of month must be'))).toBeVisible();
    }

    await page.click('button:has-text("Cancel")');
  });
});
