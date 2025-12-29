# MobileSchedule A+ Quality Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Bring MobileSchedule component to production-quality with proper testing, date handling, and testability.

**Architecture:** Fix stale date bug by making `today` injectable via prop (dependency injection for testability). Add comprehensive unit tests using vitest + React Testing Library following existing patterns. Export DayCard for reuse.

**Tech Stack:** React, TypeScript, vitest, @testing-library/react, date-fns

---

## Task 1: Make `today` Injectable for Testability

**Files:**
- Modify: `GoalConnect/client/src/components/MobileSchedule.tsx:13-29`

**Why:** The current `useMemo(() => new Date(), [])` is:
1. Stale if tab stays open past midnight
2. Untestable (can't control "today" in tests)

**Step 1: Write the failing test**

Create: `GoalConnect/client/src/components/MobileSchedule.test.tsx`

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MobileSchedule } from './MobileSchedule';

describe('MobileSchedule', () => {
  const mockGetTodosForDate = vi.fn().mockReturnValue([]);
  const mockOnToggleTodo = vi.fn();

  describe('today prop injection', () => {
    it('should use injected today prop for date calculations', () => {
      const fixedDate = new Date('2025-06-15');

      render(
        <MobileSchedule
          getTodosForDate={mockGetTodosForDate}
          onToggleTodo={mockOnToggleTodo}
          today={fixedDate}
        />
      );

      // Center card should show June 15
      expect(screen.getByText('15')).toBeInTheDocument();
      expect(screen.getByText(/Sun/)).toBeInTheDocument();
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd GoalConnect && npm run test:unit -- --run MobileSchedule.test.tsx`
Expected: FAIL with "today" prop not recognized or date mismatch

**Step 3: Modify MobileScheduleProps interface**

Edit `MobileSchedule.tsx` - add `today` prop:

```tsx
interface MobileScheduleProps {
  getTodosForDate: (date: string) => Todo[];
  onToggleTodo: (id: number) => void;
  maxOffset?: number;
  isLoading?: boolean;
  today?: Date;  // Injectable for testing, defaults to new Date()
}

export function MobileSchedule({
  getTodosForDate,
  onToggleTodo,
  maxOffset = 7,
  isLoading = false,
  today: todayProp
}: MobileScheduleProps) {
  const [offset, setOffset] = useState(0);
  const today = useMemo(() => todayProp ?? new Date(), [todayProp]);
  const todayStr = format(today, 'yyyy-MM-dd');
  // ... rest unchanged
```

**Step 4: Run test to verify it passes**

Run: `cd GoalConnect && npm run test:unit -- --run MobileSchedule.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add GoalConnect/client/src/components/MobileSchedule.tsx GoalConnect/client/src/components/MobileSchedule.test.tsx
git commit -m "feat: add today prop to MobileSchedule for testability"
```

---

## Task 2: Add Navigation Tests

**Files:**
- Modify: `GoalConnect/client/src/components/MobileSchedule.test.tsx`

**Step 1: Write the failing tests for navigation**

Add to test file:

```tsx
import userEvent from '@testing-library/user-event';

describe('navigation', () => {
  it('should navigate forward when clicking next button', async () => {
    const user = userEvent.setup();
    const fixedDate = new Date('2025-06-15');

    render(
      <MobileSchedule
        getTodosForDate={mockGetTodosForDate}
        onToggleTodo={mockOnToggleTodo}
        today={fixedDate}
      />
    );

    // Initially shows 14, 15, 16
    expect(screen.getByText('15')).toBeInTheDocument();

    const nextButton = screen.getByLabelText('Next days');
    await user.click(nextButton);

    // After clicking next, should show 15, 16, 17
    expect(screen.getByText('17')).toBeInTheDocument();
  });

  it('should navigate backward when clicking previous button', async () => {
    const user = userEvent.setup();
    const fixedDate = new Date('2025-06-15');

    render(
      <MobileSchedule
        getTodosForDate={mockGetTodosForDate}
        onToggleTodo={mockOnToggleTodo}
        today={fixedDate}
      />
    );

    const prevButton = screen.getByLabelText('Previous days');
    await user.click(prevButton);

    // After clicking prev, should show 13, 14, 15
    expect(screen.getByText('13')).toBeInTheDocument();
  });

  it('should respect maxOffset boundary going forward', async () => {
    const user = userEvent.setup();
    const fixedDate = new Date('2025-06-15');

    render(
      <MobileSchedule
        getTodosForDate={mockGetTodosForDate}
        onToggleTodo={mockOnToggleTodo}
        today={fixedDate}
        maxOffset={2}
      />
    );

    const nextButton = screen.getByLabelText('Next days');

    // Click twice to reach maxOffset
    await user.click(nextButton);
    await user.click(nextButton);

    // Button should now be disabled
    expect(nextButton).toBeDisabled();
  });

  it('should respect maxOffset boundary going backward', async () => {
    const user = userEvent.setup();
    const fixedDate = new Date('2025-06-15');

    render(
      <MobileSchedule
        getTodosForDate={mockGetTodosForDate}
        onToggleTodo={mockOnToggleTodo}
        today={fixedDate}
        maxOffset={2}
      />
    );

    const prevButton = screen.getByLabelText('Previous days');

    // Click twice to reach -maxOffset
    await user.click(prevButton);
    await user.click(prevButton);

    // Button should now be disabled
    expect(prevButton).toBeDisabled();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd GoalConnect && npm run test:unit -- --run MobileSchedule.test.tsx`
Expected: Tests should pass (navigation already implemented)

**Step 3: No implementation needed - tests verify existing behavior**

**Step 4: Run test to verify it passes**

Run: `cd GoalConnect && npm run test:unit -- --run MobileSchedule.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add GoalConnect/client/src/components/MobileSchedule.test.tsx
git commit -m "test: add navigation tests for MobileSchedule"
```

---

## Task 3: Add Reset Button Tests

**Files:**
- Modify: `GoalConnect/client/src/components/MobileSchedule.test.tsx`

**Step 1: Write the failing tests for reset functionality**

Add to test file:

```tsx
describe('reset button', () => {
  it('should not show reset button when at offset 0', () => {
    const fixedDate = new Date('2025-06-15');

    render(
      <MobileSchedule
        getTodosForDate={mockGetTodosForDate}
        onToggleTodo={mockOnToggleTodo}
        today={fixedDate}
      />
    );

    expect(screen.queryByText(/Back to today/)).not.toBeInTheDocument();
  });

  it('should show reset button when navigated away', async () => {
    const user = userEvent.setup();
    const fixedDate = new Date('2025-06-15');

    render(
      <MobileSchedule
        getTodosForDate={mockGetTodosForDate}
        onToggleTodo={mockOnToggleTodo}
        today={fixedDate}
      />
    );

    const nextButton = screen.getByLabelText('Next days');
    await user.click(nextButton);

    expect(screen.getByText(/Back to today/)).toBeInTheDocument();
  });

  it('should reset to today when reset button clicked', async () => {
    const user = userEvent.setup();
    const fixedDate = new Date('2025-06-15');

    render(
      <MobileSchedule
        getTodosForDate={mockGetTodosForDate}
        onToggleTodo={mockOnToggleTodo}
        today={fixedDate}
      />
    );

    const nextButton = screen.getByLabelText('Next days');
    await user.click(nextButton);
    await user.click(nextButton);

    // Now showing 17, 18, 19
    expect(screen.getByText('18')).toBeInTheDocument();

    const resetButton = screen.getByText(/Back to today/);
    await user.click(resetButton);

    // Should be back to 14, 15, 16
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.queryByText(/Back to today/)).not.toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify behavior**

Run: `cd GoalConnect && npm run test:unit -- --run MobileSchedule.test.tsx`
Expected: PASS (reset already implemented)

**Step 3: No implementation needed**

**Step 4: Verify passes**

Run: `cd GoalConnect && npm run test:unit -- --run MobileSchedule.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add GoalConnect/client/src/components/MobileSchedule.test.tsx
git commit -m "test: add reset button tests for MobileSchedule"
```

---

## Task 4: Add Loading State Tests

**Files:**
- Modify: `GoalConnect/client/src/components/MobileSchedule.test.tsx`

**Step 1: Write loading state test**

Add to test file:

```tsx
describe('loading state', () => {
  it('should render loading skeleton when isLoading is true', () => {
    render(
      <MobileSchedule
        getTodosForDate={mockGetTodosForDate}
        onToggleTodo={mockOnToggleTodo}
        isLoading={true}
      />
    );

    // Should show skeleton placeholders with animate-pulse
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);

    // Should NOT show navigation buttons with aria-labels
    expect(screen.queryByLabelText('Next days')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Previous days')).not.toBeInTheDocument();
  });

  it('should render normal content when isLoading is false', () => {
    render(
      <MobileSchedule
        getTodosForDate={mockGetTodosForDate}
        onToggleTodo={mockOnToggleTodo}
        isLoading={false}
      />
    );

    // Should show navigation buttons
    expect(screen.getByLabelText('Next days')).toBeInTheDocument();
    expect(screen.getByLabelText('Previous days')).toBeInTheDocument();
  });
});
```

**Step 2: Run tests**

Run: `cd GoalConnect && npm run test:unit -- --run MobileSchedule.test.tsx`
Expected: PASS

**Step 3: No implementation needed**

**Step 4: Verify passes**

Run: `cd GoalConnect && npm run test:unit -- --run MobileSchedule.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add GoalConnect/client/src/components/MobileSchedule.test.tsx
git commit -m "test: add loading state tests for MobileSchedule"
```

---

## Task 5: Add Todo Display and Toggle Tests

**Files:**
- Modify: `GoalConnect/client/src/components/MobileSchedule.test.tsx`

**Step 1: Write todo display tests**

Add to test file:

```tsx
describe('todo display', () => {
  it('should display todos for each day', () => {
    const fixedDate = new Date('2025-06-15');
    const getTodosForDate = vi.fn((date: string) => {
      if (date === '2025-06-15') {
        return [
          { id: 1, title: 'Task for today', completed: false },
          { id: 2, title: 'Another task', completed: true },
        ];
      }
      return [];
    });

    render(
      <MobileSchedule
        getTodosForDate={getTodosForDate}
        onToggleTodo={mockOnToggleTodo}
        today={fixedDate}
      />
    );

    expect(screen.getByText('Task for today')).toBeInTheDocument();
    expect(screen.getByText('Another task')).toBeInTheDocument();
  });

  it('should show "No tasks" when day has no todos', () => {
    const fixedDate = new Date('2025-06-15');

    render(
      <MobileSchedule
        getTodosForDate={mockGetTodosForDate}
        onToggleTodo={mockOnToggleTodo}
        today={fixedDate}
      />
    );

    // All three day cards should show "No tasks"
    const noTasksElements = screen.getAllByText('No tasks');
    expect(noTasksElements.length).toBe(3);
  });

  it('should show "+N more" when more than 4 todos', () => {
    const fixedDate = new Date('2025-06-15');
    const getTodosForDate = vi.fn((date: string) => {
      if (date === '2025-06-15') {
        return [
          { id: 1, title: 'Task 1', completed: false },
          { id: 2, title: 'Task 2', completed: false },
          { id: 3, title: 'Task 3', completed: false },
          { id: 4, title: 'Task 4', completed: false },
          { id: 5, title: 'Task 5', completed: false },
          { id: 6, title: 'Task 6', completed: false },
        ];
      }
      return [];
    });

    render(
      <MobileSchedule
        getTodosForDate={getTodosForDate}
        onToggleTodo={mockOnToggleTodo}
        today={fixedDate}
      />
    );

    expect(screen.getByText('+2 more')).toBeInTheDocument();
  });

  it('should call onToggleTodo when todo clicked', async () => {
    const user = userEvent.setup();
    const fixedDate = new Date('2025-06-15');
    const onToggle = vi.fn();
    const getTodosForDate = vi.fn((date: string) => {
      if (date === '2025-06-15') {
        return [{ id: 42, title: 'Click me', completed: false }];
      }
      return [];
    });

    render(
      <MobileSchedule
        getTodosForDate={getTodosForDate}
        onToggleTodo={onToggle}
        today={fixedDate}
      />
    );

    const todoButton = screen.getByText('Click me');
    await user.click(todoButton);

    expect(onToggle).toHaveBeenCalledWith(42);
  });

  it('should apply completed styling to completed todos', () => {
    const fixedDate = new Date('2025-06-15');
    const getTodosForDate = vi.fn((date: string) => {
      if (date === '2025-06-15') {
        return [{ id: 1, title: 'Completed task', completed: true }];
      }
      return [];
    });

    render(
      <MobileSchedule
        getTodosForDate={getTodosForDate}
        onToggleTodo={mockOnToggleTodo}
        today={fixedDate}
      />
    );

    const todoButton = screen.getByText('Completed task');
    expect(todoButton.className).toContain('line-through');
    expect(todoButton.className).toContain('opacity-50');
  });
});
```

**Step 2: Run tests**

Run: `cd GoalConnect && npm run test:unit -- --run MobileSchedule.test.tsx`
Expected: PASS

**Step 3: No implementation needed**

**Step 4: Verify passes**

Run: `cd GoalConnect && npm run test:unit -- --run MobileSchedule.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add GoalConnect/client/src/components/MobileSchedule.test.tsx
git commit -m "test: add todo display and toggle tests for MobileSchedule"
```

---

## Task 6: Add Today Highlighting Tests

**Files:**
- Modify: `GoalConnect/client/src/components/MobileSchedule.test.tsx`

**Step 1: Write today highlighting test**

Add to test file:

```tsx
describe('today highlighting', () => {
  it('should mark today card with "Today" label', () => {
    const fixedDate = new Date('2025-06-15');

    render(
      <MobileSchedule
        getTodosForDate={mockGetTodosForDate}
        onToggleTodo={mockOnToggleTodo}
        today={fixedDate}
      />
    );

    // The center card (today) should show "Sun · Today"
    expect(screen.getByText(/· Today/)).toBeInTheDocument();
  });

  it('should not show "Today" label on other days', () => {
    const fixedDate = new Date('2025-06-15');

    render(
      <MobileSchedule
        getTodosForDate={mockGetTodosForDate}
        onToggleTodo={mockOnToggleTodo}
        today={fixedDate}
      />
    );

    // Only one element should contain "Today"
    const todayLabels = screen.getAllByText(/Today/);
    expect(todayLabels.length).toBe(1);
  });
});
```

**Step 2: Run tests**

Run: `cd GoalConnect && npm run test:unit -- --run MobileSchedule.test.tsx`
Expected: PASS

**Step 3: No implementation needed**

**Step 4: Verify passes**

Run: `cd GoalConnect && npm run test:unit -- --run MobileSchedule.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add GoalConnect/client/src/components/MobileSchedule.test.tsx
git commit -m "test: add today highlighting tests for MobileSchedule"
```

---

## Task 7: Add Touch Target Accessibility Tests

**Files:**
- Modify: `GoalConnect/client/src/components/MobileSchedule.test.tsx`

**Step 1: Write accessibility test**

Add to test file:

```tsx
describe('accessibility', () => {
  it('should have aria-labels on navigation buttons', () => {
    render(
      <MobileSchedule
        getTodosForDate={mockGetTodosForDate}
        onToggleTodo={mockOnToggleTodo}
      />
    );

    expect(screen.getByLabelText('Previous days')).toBeInTheDocument();
    expect(screen.getByLabelText('Next days')).toBeInTheDocument();
  });

  it('should have 44px minimum touch targets on navigation buttons', () => {
    render(
      <MobileSchedule
        getTodosForDate={mockGetTodosForDate}
        onToggleTodo={mockOnToggleTodo}
      />
    );

    const prevButton = screen.getByLabelText('Previous days');
    const nextButton = screen.getByLabelText('Next days');

    // w-11 = 44px (2.75rem * 16px)
    expect(prevButton.className).toContain('w-11');
    expect(prevButton.className).toContain('h-11');
    expect(nextButton.className).toContain('w-11');
    expect(nextButton.className).toContain('h-11');
  });

  it('should have 44px minimum touch targets on todo items', () => {
    const fixedDate = new Date('2025-06-15');
    const getTodosForDate = vi.fn((date: string) => {
      if (date === '2025-06-15') {
        return [{ id: 1, title: 'Test task', completed: false }];
      }
      return [];
    });

    render(
      <MobileSchedule
        getTodosForDate={getTodosForDate}
        onToggleTodo={mockOnToggleTodo}
        today={fixedDate}
      />
    );

    const todoButton = screen.getByText('Test task');
    // min-h-[44px] ensures minimum touch target
    expect(todoButton.className).toContain('min-h-[44px]');
  });
});
```

**Step 2: Run tests**

Run: `cd GoalConnect && npm run test:unit -- --run MobileSchedule.test.tsx`
Expected: PASS

**Step 3: No implementation needed**

**Step 4: Verify all tests pass**

Run: `cd GoalConnect && npm run test:unit -- --run MobileSchedule.test.tsx`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add GoalConnect/client/src/components/MobileSchedule.test.tsx
git commit -m "test: add accessibility tests for MobileSchedule touch targets"
```

---

## Task 8: Final Verification

**Files:** None (verification only)

**Step 1: Run full test suite**

Run: `cd GoalConnect && npm run test:unit -- --run`
Expected: All tests PASS

**Step 2: Run build**

Run: `cd GoalConnect && npm run build`
Expected: Build succeeds without errors

**Step 3: Run type check**

Run: `cd GoalConnect && npx tsc --noEmit`
Expected: No type errors

**Step 4: Commit final state (if any cleanup needed)**

```bash
git status
# Only commit if there are changes
```

---

## Summary

| Task | Description | Deliverable |
|------|-------------|-------------|
| 1 | Make `today` injectable | `today` prop + first test |
| 2 | Navigation tests | Forward/backward/boundary tests |
| 3 | Reset button tests | Show/hide/click behavior tests |
| 4 | Loading state tests | Skeleton/normal state tests |
| 5 | Todo display tests | Display/toggle/overflow tests |
| 6 | Today highlighting tests | Label/styling tests |
| 7 | Accessibility tests | Touch target/aria tests |
| 8 | Final verification | Full test suite + build |

**Test file location:** `GoalConnect/client/src/components/MobileSchedule.test.tsx`

**Expected test count:** ~20 tests covering all MobileSchedule behavior
