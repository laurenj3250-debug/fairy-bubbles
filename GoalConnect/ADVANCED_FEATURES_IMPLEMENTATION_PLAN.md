# 🚀 Advanced Features Implementation Plan (Phases 5-8)

## Overview
This document outlines the comprehensive implementation strategy for Phases 5-8 of the Todoist-level task management system. Each phase builds upon the previous work while maintaining code quality, type safety, and UX consistency.

---

## 📋 Phase 5: Keyboard Shortcuts

### Goal
Implement professional-grade keyboard shortcuts for power users, making task management blazingly fast.

### Technical Architecture

#### 1. Keyboard Event Handler
**File:** `client/src/hooks/useKeyboardShortcuts.ts`
- Custom React hook for global keyboard event management
- Handles modifier keys (⌘/Ctrl, Shift, Alt)
- Prevents conflicts with browser shortcuts
- Respects input focus (don't trigger when typing in forms)

**Key Implementation:**
```typescript
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    // Ignore if typing in input/textarea
    if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

    // ⌘K / Ctrl+K: Quick add
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      openQuickAdd();
    }

    // E: Edit focused task
    if (e.key === 'e' && focusedTask) {
      e.preventDefault();
      editTask(focusedTask);
    }

    // ... more shortcuts
  };
}, [focusedTask, /* other deps */]);
```

#### 2. Focus Management System
**File:** `client/src/hooks/useFocusManagement.ts`
- Track which task is currently "focused" (keyboard navigation)
- Arrow up/down to move focus
- Visual indicator for focused task
- Maintains focus across filters/sorting changes

#### 3. Quick Add Modal
**File:** `client/src/components/QuickAddModal.tsx`
- Lightweight version of TodoDialogEnhanced
- Pre-filled with smart defaults
- Keyboard-first design (Tab navigation, Enter to submit, Escape to cancel)

#### 4. Keyboard Shortcuts Help Overlay
**File:** `client/src/components/KeyboardShortcutsHelp.tsx`
- Triggered by `?` key
- Beautiful modal showing all available shortcuts
- Organized by category (Navigation, Actions, Filters)

### Implementation Steps

1. **Create useKeyboardShortcuts hook**
   - Handle global key events
   - Support modifier combinations
   - Platform detection (Mac vs Windows/Linux)

2. **Create useFocusManagement hook**
   - Track focused task index
   - Handle arrow key navigation
   - Wrap focus at list boundaries

3. **Add visual focus indicator to tasks**
   - Subtle ring/border when task is focused
   - Ensure accessibility (screen readers)

4. **Implement QuickAddModal**
   - Minimal UI (just title + due date)
   - Fast creation workflow
   - Smart defaults (today's date, medium difficulty)

5. **Create keyboard shortcuts help modal**
   - List all shortcuts with descriptions
   - Searchable/filterable
   - Print-friendly layout

6. **Add keyboard shortcut hints to UI**
   - Tooltips showing shortcut keys
   - Subtle badge indicators on buttons

### Shortcuts to Implement

| Key | Action | Description |
|-----|--------|-------------|
| `⌘K` / `Ctrl+K` | Quick Add | Open minimal task creation modal |
| `↑` / `↓` | Navigate | Move focus between tasks |
| `Enter` | Open | Open focused task details/edit |
| `E` | Edit | Edit focused task |
| `Delete` / `Backspace` | Delete | Delete focused task (with confirmation) |
| `Space` | Toggle | Complete/uncomplete focused task |
| `1-4` | Priority | Set priority of focused task |
| `P` | Project | Open project selector for focused task |
| `L` | Labels | Open label picker for focused task |
| `D` | Due Date | Set due date for focused task |
| `?` | Help | Show keyboard shortcuts overlay |
| `Escape` | Close | Close any open modal/overlay |

### Testing Checklist
- [ ] All shortcuts work on Mac (⌘ key)
- [ ] All shortcuts work on Windows/Linux (Ctrl key)
- [ ] No conflicts with browser shortcuts
- [ ] Focus management works across filters
- [ ] Quick add modal is keyboard-navigable
- [ ] Help overlay is accessible

---

## 🤖 Phase 6: Natural Language Input

### Goal
Parse natural language task descriptions to automatically extract dates, times, projects, labels, and priorities.

### Technical Architecture

#### 1. Natural Language Parser
**File:** `client/src/lib/nlp/taskParser.ts`

Core parsing logic using regex patterns and context-aware detection:

**Supported Patterns:**
- **Dates:** "tomorrow", "next week", "Jan 15", "2025-01-20"
- **Times:** "3pm", "15:00", "at 9am", "by 5:30pm"
- **Projects:** "#project-name", "in [Project Name]"
- **Labels:** "@label-name", "#label"
- **Priority:** "p1", "urgent", "high priority", "low"
- **Recurrence:** "daily", "weekly", "every Monday"

**Example Inputs:**
```
"Fix auth bug tomorrow 3pm #backend @urgent p1"
→ title: "Fix auth bug"
→ dueDate: tomorrow at 3pm
→ project: backend
→ labels: [urgent]
→ priority: 1

"Review PR weekly on Monday #code-review"
→ title: "Review PR"
→ recurrence: weekly (Monday)
→ project: code-review
```

#### 2. Smart Input Component
**File:** `client/src/components/SmartTaskInput.tsx`
- Single text input with rich parsing
- Real-time preview of extracted fields
- Inline suggestions (autocomplete for projects/labels)
- Visual highlights showing what was parsed

#### 3. Parser Engine Implementation

```typescript
interface ParsedTask {
  title: string;
  dueDate?: string;
  dueTime?: string;
  projectName?: string;
  labelNames?: string[];
  priority?: number;
  recurrence?: string;
  notes?: string;
}

export function parseTaskInput(input: string): ParsedTask {
  let remaining = input;
  const result: ParsedTask = { title: '' };

  // Extract priority (p1-p4)
  const priorityMatch = remaining.match(/\bp([1-4])\b/i);
  if (priorityMatch) {
    result.priority = parseInt(priorityMatch[1]);
    remaining = remaining.replace(priorityMatch[0], '').trim();
  }

  // Extract project (#project or in [project])
  const projectMatch = remaining.match(/#(\w+)/);
  if (projectMatch) {
    result.projectName = projectMatch[1];
    remaining = remaining.replace(projectMatch[0], '').trim();
  }

  // Extract labels (@label)
  const labelMatches = remaining.matchAll(/@(\w+)/g);
  result.labelNames = Array.from(labelMatches, m => m[1]);
  remaining = remaining.replace(/@\w+/g, '').trim();

  // Extract dates (tomorrow, next week, specific dates)
  const dateMatch = extractDate(remaining);
  if (dateMatch) {
    result.dueDate = dateMatch.date;
    result.dueTime = dateMatch.time;
    remaining = remaining.replace(dateMatch.raw, '').trim();
  }

  // Remaining text is the title
  result.title = remaining.trim();

  return result;
}
```

#### 4. Date/Time Parser
**File:** `client/src/lib/nlp/dateParser.ts`

Use a combination of regex patterns and date libraries:
- Relative dates: "today", "tomorrow", "next Monday"
- Absolute dates: "Jan 15", "2025-01-20", "15/01/2025"
- Time parsing: "3pm", "15:00", "at 9am"
- Fuzzy matching: "in 3 days", "next week"

Library options:
- **chrono-node** - Excellent NLP date parser
- **date-fns** - For date manipulation
- Custom regex for task-specific patterns

#### 5. Autocomplete System
**File:** `client/src/components/TaskInputAutocomplete.tsx`
- Suggest projects as user types "#"
- Suggest labels as user types "@"
- Show date suggestions for natural language
- Keyboard navigable suggestions

### Implementation Steps

1. **Install dependencies**
   ```bash
   npm install chrono-node date-fns
   ```

2. **Create taskParser.ts**
   - Implement regex-based extraction
   - Handle multiple patterns per field
   - Preserve original input for title

3. **Create dateParser.ts**
   - Integrate chrono-node
   - Add custom patterns for task-specific dates
   - Handle time zones correctly

4. **Create SmartTaskInput component**
   - Single input field with parsing preview
   - Show extracted fields below input
   - Allow manual correction of parsed fields

5. **Add autocomplete functionality**
   - Detect trigger characters (#, @)
   - Fetch matching projects/labels
   - Show dropdown with suggestions
   - Handle keyboard selection

6. **Integrate with TodoDialogEnhanced**
   - Add toggle for "Smart Input" vs "Classic Form"
   - Preserve both modes for user preference
   - Auto-populate form from parsed input

7. **Add learning/suggestions**
   - Track commonly used combinations
   - Suggest based on patterns (e.g., "standup" → daily, Monday 9am)

### Testing Checklist
- [ ] Correctly parses all date formats
- [ ] Handles time zones correctly
- [ ] Extracts multiple labels
- [ ] Matches projects case-insensitively
- [ ] Preserves remaining text as title
- [ ] Autocomplete works for projects/labels
- [ ] Handles malformed input gracefully
- [ ] Works with international date formats

---

## 🔄 Phase 7: Recurring Tasks

### Goal
Support repeating tasks with flexible scheduling patterns, automatically creating new instances when completed.

### Technical Architecture

#### 1. Database Schema Extension
**Migration:** `migrations/0015_recurring_tasks.sql`

Already have `recurring_pattern` and `next_recurrence` columns in todos table. Just need to populate them.

**Recurrence Pattern Format:**
Use cron-like syntax or human-readable format:
```typescript
interface RecurrencePattern {
  type: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  interval: number; // e.g., every 2 weeks
  daysOfWeek?: number[]; // [0-6] for weekly (0 = Sunday)
  dayOfMonth?: number; // 1-31 for monthly
  endDate?: string; // When to stop recurring
  endAfter?: number; // Stop after N occurrences
}
```

**Storage:** Store as JSON in `recurring_pattern` column

#### 2. Recurrence Scheduler
**File:** `server/lib/recurrenceScheduler.ts`

Background job that:
- Runs every hour (or use cron job)
- Finds tasks where `next_recurrence <= today`
- Creates new instance of the task
- Updates `next_recurrence` to next occurrence
- Handles end conditions

```typescript
export async function processRecurringTasks() {
  const today = new Date();

  // Find tasks ready for next recurrence
  const recurringTasks = await db
    .select()
    .from(todos)
    .where(
      and(
        isNotNull(todos.recurringPattern),
        lte(todos.nextRecurrence, today)
      )
    );

  for (const task of recurringTasks) {
    // Create new instance
    const newTask = await createRecurringInstance(task);

    // Calculate next occurrence
    const nextDate = calculateNextOccurrence(
      task.recurringPattern,
      task.nextRecurrence
    );

    // Update original task
    await db
      .update(todos)
      .set({ nextRecurrence: nextDate })
      .where(eq(todos.id, task.id));
  }
}
```

#### 3. Recurrence Picker Component
**File:** `client/src/components/RecurrencePicker.tsx`

Beautiful UI for selecting recurrence patterns:
- Quick presets (Daily, Weekly, Monthly)
- Custom interval selector
- Day of week picker (for weekly)
- Day of month picker (for monthly)
- End condition selector (never, on date, after N times)
- Visual preview of next 5 occurrences

#### 4. Date Calculation Engine
**File:** `shared/lib/recurrenceEngine.ts`

Shared between client and server:
```typescript
export function calculateNextOccurrence(
  pattern: RecurrencePattern,
  currentDate: Date
): Date {
  switch (pattern.type) {
    case 'daily':
      return addDays(currentDate, pattern.interval);
    case 'weekly':
      return calculateNextWeekly(currentDate, pattern);
    case 'monthly':
      return calculateNextMonthly(currentDate, pattern);
    // ... more cases
  }
}
```

#### 5. Recurring Task Management UI
**Features:**
- Visual indicator for recurring tasks (🔄 icon)
- "Complete Instance Only" vs "Complete All Future"
- "Skip Next Occurrence" option
- Edit recurrence pattern
- View all instances in series

### Implementation Steps

1. **Create recurrence picker component**
   - Preset buttons (Daily, Weekly, etc.)
   - Custom interval input
   - Day/week/month selectors
   - End condition options

2. **Add recurrence field to TodoDialogEnhanced**
   - Integrate RecurrencePicker
   - Show preview of next occurrences
   - Validate recurrence patterns

3. **Create recurrence calculation engine (shared/)**
   - Implement date math for all patterns
   - Handle edge cases (end of month, leap years)
   - Support all recurrence types

4. **Create server-side scheduler**
   - Background job to process recurring tasks
   - Create new instances
   - Update next_recurrence dates
   - Handle end conditions

5. **Add API endpoints**
   - `POST /api/todos/:id/recurrence` - Set recurrence
   - `DELETE /api/todos/:id/recurrence` - Remove recurrence
   - `POST /api/todos/:id/skip-next` - Skip next instance
   - `GET /api/todos/:id/instances` - Get all instances

6. **Update task display**
   - Show 🔄 icon for recurring tasks
   - Display "Next: [date]" for upcoming instance
   - Add "Complete Instance Only" button

7. **Set up cron job or interval**
   - Use `node-cron` for scheduling
   - Run recurrence processor every hour
   - Log created instances

### Testing Checklist
- [ ] Daily recurrence creates tasks correctly
- [ ] Weekly recurrence respects day of week
- [ ] Monthly recurrence handles end-of-month
- [ ] End date stops creating instances
- [ ] End after N occurrences works
- [ ] Completing instance only keeps series alive
- [ ] Completing all future stops recurrence
- [ ] Skip next occurrence works
- [ ] Editing pattern updates future instances
- [ ] Timezone handling is correct

---

## 🖱️ Phase 8: Drag & Drop

### Goal
Enable drag-and-drop reordering of tasks for manual prioritization and organization.

### Technical Architecture

#### 1. Drag & Drop Library
**Choice:** `@dnd-kit/core` + `@dnd-kit/sortable`

Why?
- Modern, performant, accessible
- Touch-friendly (works on mobile)
- Flexible and composable
- Great TypeScript support
- Active maintenance

**Installation:**
```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

#### 2. Sortable Task List
**File:** `client/src/components/SortableTaskList.tsx`

```typescript
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

export function SortableTaskList({ todos, onReorder }) {
  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = todos.findIndex(t => t.id === active.id);
      const newIndex = todos.findIndex(t => t.id === over.id);

      onReorder(oldIndex, newIndex);
    }
  };

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={todos} strategy={verticalListSortingStrategy}>
        {todos.map((todo) => (
          <SortableTaskItem key={todo.id} todo={todo} />
        ))}
      </SortableContext>
    </DndContext>
  );
}
```

#### 3. Position Management System

**Two approaches:**

**Option A: Position Field (Simple)**
- Use existing `position` column in todos table
- Store integer position (0, 1, 2, ...)
- On reorder, update positions sequentially
- Sort by position in queries

**Option B: Fractional Indexing (Advanced)**
- Store positions as strings like "a0", "a1", "a2"
- Allows inserting between items without updating all positions
- More efficient for large lists

We'll use **Option A** for simplicity.

#### 4. Reorder API Endpoint
**File:** `server/routes/todos.ts`

```typescript
// PATCH /api/todos/reorder
app.patch('/api/todos/reorder', async (req, res) => {
  const { taskId, newPosition, projectId } = req.body;

  // Get all tasks in the same context (same project or no project)
  const tasksToUpdate = await db
    .select()
    .from(todos)
    .where(
      and(
        eq(todos.userId, req.user.id),
        projectId ? eq(todos.projectId, projectId) : isNull(todos.projectId)
      )
    )
    .orderBy(todos.position);

  // Recalculate positions
  const updatedPositions = calculateNewPositions(tasksToUpdate, taskId, newPosition);

  // Batch update
  await db.transaction(async (tx) => {
    for (const { id, position } of updatedPositions) {
      await tx.update(todos).set({ position }).where(eq(todos.id, id));
    }
  });

  res.json({ success: true });
});
```

#### 5. Drag Between Projects
- Detect when task is dragged over a project badge/card
- Update both `position` and `projectId`
- Optimistic UI update
- Confirm via API

#### 6. Visual Feedback
- Semi-transparent drag preview
- Drop zone highlighting
- Smooth animations
- Haptic feedback on mobile (if supported)

### Implementation Steps

1. **Install @dnd-kit dependencies**
   ```bash
   npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
   ```

2. **Create SortableTaskItem component**
   - Wrap existing task card
   - Add drag handle (⋮⋮ icon)
   - Style dragging state

3. **Create SortableTaskList component**
   - Set up DndContext
   - Handle drag events
   - Implement reorder logic

4. **Update Todos.tsx to use SortableTaskList**
   - Replace task mapping with sortable version
   - Add toggle for "Manual Sort" mode
   - Show drag handles when in manual sort mode

5. **Create reorder API endpoint**
   - Accept taskId and newPosition
   - Recalculate all positions in batch
   - Use database transaction for consistency

6. **Add optimistic updates**
   - Update UI immediately when dragging
   - Revert if API call fails
   - Show loading state

7. **Add drag-between-projects**
   - Detect drop on project filter/badge
   - Update projectId
   - Recalculate positions in new project

8. **Add animations**
   - Smooth transitions using framer-motion
   - Spring physics for natural feel
   - Fade in/out for items being moved

### Testing Checklist
- [ ] Can drag tasks up and down
- [ ] Position persists after refresh
- [ ] Works with filters active
- [ ] Can drag between projects
- [ ] Optimistic updates work correctly
- [ ] Handles API failures gracefully
- [ ] Works on touch devices
- [ ] Accessible with keyboard (Tab + Space)
- [ ] Doesn't interfere with clicking/editing
- [ ] Smooth animations

---

## 🎯 Implementation Order & Dependencies

### Recommended Sequence

1. **Phase 5: Keyboard Shortcuts** (Independent)
   - No dependencies on other phases
   - Enhances existing functionality
   - Can be implemented first for quick wins

2. **Phase 6: Natural Language Input** (Independent)
   - No dependencies on other phases
   - Adds alternative input method
   - Can run in parallel with Phase 5

3. **Phase 7: Recurring Tasks** (Depends on backend setup)
   - Requires scheduler setup
   - May want keyboard shortcuts for recurrence (Phase 5)
   - Natural language could parse recurrence (Phase 6)

4. **Phase 8: Drag & Drop** (Depends on position system)
   - Works best after manual sorting is established
   - Complements keyboard shortcuts
   - Independent of recurring tasks

### Parallel Execution Plan

**Week 1:**
- Phase 5 & 6 in parallel (different areas of codebase)

**Week 2:**
- Phase 7 (recurring tasks + scheduler)

**Week 3:**
- Phase 8 (drag & drop)
- Polish and integration

---

## 🧪 Quality Assurance

### Testing Strategy for Each Phase

1. **Unit Tests**
   - Parser functions (Phase 6)
   - Recurrence calculations (Phase 7)
   - Position calculations (Phase 8)

2. **Integration Tests**
   - Keyboard shortcuts don't conflict
   - Natural language integrates with create flow
   - Recurring tasks create correctly
   - Drag & drop updates database

3. **E2E Tests**
   - Complete user workflows
   - Cross-browser compatibility
   - Mobile responsiveness

4. **Accessibility Tests**
   - Keyboard navigation (all phases)
   - Screen reader compatibility
   - Touch targets are adequate

### Performance Considerations

- **Phase 5:** Debounce keyboard events
- **Phase 6:** Cache parsed results, debounce parsing
- **Phase 7:** Background job optimization, batch processing
- **Phase 8:** Virtual scrolling for large lists, batch position updates

---

## 📊 Success Metrics

### Phase 5: Keyboard Shortcuts
- 50%+ of power users adopt keyboard shortcuts
- Average time to create task < 5 seconds
- Zero conflicts with browser shortcuts

### Phase 6: Natural Language Input
- 70%+ parse accuracy for common inputs
- 30%+ of new tasks created via smart input
- Users prefer it over classic form

### Phase 7: Recurring Tasks
- Support for daily, weekly, monthly patterns
- 100% accuracy in recurrence calculation
- Background job runs reliably

### Phase 8: Drag & Drop
- Smooth 60fps animations
- Works on 95%+ of devices (desktop + mobile)
- Position updates in < 500ms

---

## 🚀 Execution Plan with skill-router

Each phase will be executed using the skill-router to automatically:
1. Identify the best approach
2. Select appropriate tools/libraries
3. Implement features systematically
4. Test thoroughly
5. Document and commit

**Next Step:** Use skill-router to begin Phase 5 implementation.
