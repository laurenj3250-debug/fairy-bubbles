# useFocusManagement Hook

A comprehensive React hook for managing keyboard focus across task lists, enabling power users to navigate and interact with tasks using only their keyboard.

## Overview

The `useFocusManagement` hook provides a complete solution for implementing keyboard navigation in task management applications. It handles:

- **Arrow key navigation** (↑/↓) to move focus between tasks
- **Focus wrapping** at list boundaries (configurable)
- **Focus persistence** when the task list changes (filtered, sorted, or modified)
- **Visual focus indicators** for the currently focused task
- **Seamless integration** with keyboard shortcuts
- **Accessibility support** for screen readers

## Installation

The hook is located at `client/src/hooks/useFocusManagement.ts` and can be imported directly:

```tsx
import { useFocusManagement } from '@/hooks/useFocusManagement';
```

## Basic Usage

```tsx
import { useFocusManagement, FOCUS_RING_STYLES } from '@/hooks/useFocusManagement';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

function TodoList({ todos }) {
  // Initialize focus management
  const { focusedTask, focusNext, focusPrevious } = useFocusManagement(todos);

  // Set up keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'ArrowDown',
      description: 'Move to next task',
      action: focusNext,
    },
    {
      key: 'ArrowUp',
      description: 'Move to previous task',
      action: focusPrevious,
    },
  ]);

  return (
    <div>
      {todos.map((todo) => (
        <div
          key={todo.id}
          className={cn(
            'task-item',
            focusedTask?.id === todo.id && FOCUS_RING_STYLES
          )}
        >
          {todo.title}
        </div>
      ))}
    </div>
  );
}
```

## API Reference

### Hook Signature

```typescript
function useFocusManagement(
  tasks: Todo[],
  options?: UseFocusManagementOptions
): UseFocusManagementReturn
```

### Parameters

#### `tasks: Todo[]`
The array of tasks to manage focus for. The hook automatically handles changes to this array, maintaining focus intelligently when tasks are added, removed, filtered, or sorted.

#### `options?: UseFocusManagementOptions`
Optional configuration object:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `wrap` | `boolean` | `true` | Enable wrapping at list boundaries. When `true`, pressing ↓ on the last item focuses the first item, and pressing ↑ on the first item focuses the last item. |
| `autoFocusFirst` | `boolean` | `false` | Automatically focus the first task when the list becomes non-empty. Useful when applying filters. |
| `onFocusChange` | `(task: Todo \| null, index: number \| null) => void` | `undefined` | Callback function called whenever focus changes. Receives the newly focused task and its index. |

### Return Value

The hook returns an object with the following properties and methods:

| Property/Method | Type | Description |
|----------------|------|-------------|
| `focusedIndex` | `number \| null` | The current focused task index (0-based). `null` if no task is focused. |
| `focusedTask` | `Todo \| null` | The currently focused task object. `null` if no task is focused. |
| `focusNext()` | `() => void` | Move focus to the next task in the list. Wraps to first if at end (when `wrap` is enabled). |
| `focusPrevious()` | `() => void` | Move focus to the previous task in the list. Wraps to last if at start (when `wrap` is enabled). |
| `focusFirst()` | `() => void` | Move focus to the first task in the list. |
| `focusLast()` | `() => void` | Move focus to the last task in the list. |
| `setFocusedIndex(index)` | `(index: number \| null) => void` | Set focus to a specific index. Validates the index and clears focus if invalid. |
| `clearFocus()` | `() => void` | Clear focus (set to `null`). |
| `setFocusedTaskId(taskId)` | `(taskId: number \| null) => void` | Set focus to a specific task by its ID. Searches for the task in the list and focuses it. |

## Advanced Usage

### Full Keyboard Shortcuts Integration

```tsx
function TodoList({ todos, onEdit, onDelete, onToggleComplete }) {
  const {
    focusedTask,
    focusNext,
    focusPrevious,
    focusFirst,
    focusLast,
  } = useFocusManagement(todos, {
    wrap: true,
    onFocusChange: (task, index) => {
      // Scroll focused task into view
      if (index !== null) {
        document
          .querySelector(`[data-task-index="${index}"]`)
          ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    },
  });

  useKeyboardShortcuts([
    // Navigation
    { key: 'ArrowDown', description: 'Next task', action: focusNext },
    { key: 'ArrowUp', description: 'Previous task', action: focusPrevious },
    { key: 'Home', description: 'First task', action: focusFirst },
    { key: 'End', description: 'Last task', action: focusLast },

    // Actions on focused task
    {
      key: 'Enter',
      description: 'Edit focused task',
      action: () => focusedTask && onEdit(focusedTask),
    },
    {
      key: ' ',
      description: 'Toggle completion',
      action: () => focusedTask && onToggleComplete(focusedTask),
    },
    {
      key: 'Delete',
      description: 'Delete focused task',
      action: () => focusedTask && onDelete(focusedTask),
    },
  ]);

  // ... render tasks
}
```

### Click-to-Focus Integration

Combine keyboard and mouse interaction:

```tsx
function TodoList({ todos }) {
  const { focusedTask, setFocusedTaskId, focusNext, focusPrevious } =
    useFocusManagement(todos);

  return (
    <div>
      {todos.map((todo) => (
        <div
          key={todo.id}
          onClick={() => setFocusedTaskId(todo.id)}
          className={cn(
            'task-item cursor-pointer',
            focusedTask?.id === todo.id && FOCUS_RING_STYLES
          )}
        >
          {todo.title}
        </div>
      ))}
    </div>
  );
}
```

### Auto-Focus on Filter Changes

```tsx
function FilteredTodoList({ todos, filter }) {
  const { focusedTask, focusNext, focusPrevious } = useFocusManagement(todos, {
    // Auto-focus first task when filter is applied
    autoFocusFirst: true,
  });

  // When filter changes, the hook automatically focuses the first task
  // in the filtered list (if autoFocusFirst is enabled)

  // ... rest of component
}
```

### Multiple Lists

Manage focus across multiple task lists:

```tsx
function MultiListView({ todayTasks, upcomingTasks }) {
  const [activeList, setActiveList] = useState('today');

  const todayFocus = useFocusManagement(todayTasks);
  const upcomingFocus = useFocusManagement(upcomingTasks);

  const activeFocus = activeList === 'today' ? todayFocus : upcomingFocus;

  useKeyboardShortcuts([
    { key: 'ArrowDown', action: activeFocus.focusNext },
    { key: 'ArrowUp', action: activeFocus.focusPrevious },
    {
      key: 'Tab',
      action: () => setActiveList(prev => prev === 'today' ? 'upcoming' : 'today'),
    },
  ]);

  // ... render both lists
}
```

## Helper Functions

### `isTaskFocused(task, focusedTask)`

Checks if a task is currently focused. Useful for applying visual styles.

```tsx
import { isTaskFocused } from '@/hooks/useFocusManagement';

<div className={cn(
  'task-item',
  isTaskFocused(todo, focusedTask) && 'ring-2 ring-blue-500'
)}>
  {todo.title}
</div>
```

## Visual Focus Styles

### Default Focus Ring

```tsx
import { FOCUS_RING_STYLES } from '@/hooks/useFocusManagement';

<div className={cn('task-item', isFocused && FOCUS_RING_STYLES)}>
  {todo.title}
</div>
```

Renders as: `"ring-2 ring-blue-500 ring-offset-2 ring-offset-background"`

### Subtle Focus Style

```tsx
import { SUBTLE_FOCUS_STYLES } from '@/hooks/useFocusManagement';

<div className={cn('task-item', isFocused && SUBTLE_FOCUS_STYLES)}>
  {todo.title}
</div>
```

Renders as: `"bg-accent/50 border-l-4 border-blue-500"`

### Custom Focus Styles

Create your own focus styles:

```tsx
<div className={cn(
  'task-item',
  isFocused && 'bg-blue-50 dark:bg-blue-900/20 shadow-md'
)}>
  {todo.title}
</div>
```

## Focus Persistence

The hook intelligently maintains focus when the task list changes:

### Task Deletion
When a focused task is deleted, focus automatically moves to the next task (or the previous task if the last task was deleted).

```tsx
const handleDelete = (taskId) => {
  // Delete the task
  deleteTodo(taskId);

  // Focus automatically adjusts to the next task
  // No manual focus management needed!
};
```

### Filtering
When tasks are filtered, the hook attempts to maintain focus on the same task if it's still in the filtered list.

```tsx
// User focuses task #5
// User applies filter -> task #5 is still visible
// Hook maintains focus on task #5 (even though its index may have changed)

// If the focused task is no longer in the filtered list,
// focus moves to the task at the same index position
```

### Sorting
When tasks are sorted, focus follows the task (not the index position).

```tsx
// User focuses "Buy groceries" at index 0
// User sorts by priority -> "Buy groceries" moves to index 5
// Hook maintains focus on "Buy groceries" (now at index 5)
```

## Accessibility

### Screen Reader Support

Add ARIA attributes to enhance screen reader support:

```tsx
<div
  role="listitem"
  aria-selected={isFocused}
  aria-label={todo.title}
  className={cn('task-item', isFocused && FOCUS_RING_STYLES)}
>
  {todo.title}
</div>
```

### Keyboard Navigation Announcement

Add a live region to announce focus changes:

```tsx
function TodoList({ todos }) {
  const { focusedTask, focusNext, focusPrevious } = useFocusManagement(todos);

  return (
    <div>
      {/* Screen reader announcement */}
      <div
        role="status"
        aria-live="polite"
        className="sr-only"
      >
        {focusedTask && `Focused: ${focusedTask.title}`}
      </div>

      {/* Task list */}
      {todos.map((todo) => (
        <div key={todo.id}>{todo.title}</div>
      ))}
    </div>
  );
}
```

## Testing

### Unit Testing

The hook is designed to be testable. Use `@testing-library/react-hooks` for unit tests:

```tsx
import { renderHook, act } from '@testing-library/react-hooks';
import { useFocusManagement } from './useFocusManagement';

test('should focus next task', () => {
  const { result } = renderHook(() =>
    useFocusManagement(mockTodos)
  );

  act(() => {
    result.current.focusNext();
  });

  expect(result.current.focusedIndex).toBe(0);
});
```

### E2E Testing

A comprehensive Playwright test suite is provided in `tests/focus-management.spec.ts`.

Run tests:
```bash
npm test -- focus-management
```

## Best Practices

### 1. Always Provide Visual Feedback
Users need to see which task is focused. Always apply visual styles to the focused task.

✅ **Good:**
```tsx
<div className={cn('task-item', isFocused && FOCUS_RING_STYLES)}>
```

❌ **Bad:**
```tsx
<div className="task-item">  {/* No visual indication */}
```

### 2. Use `data-testid` for Testing
Add test IDs to enable reliable e2e testing:

```tsx
<div data-testid="task-item" data-task-id={todo.id}>
```

### 3. Handle Empty Lists Gracefully
The hook handles empty lists automatically, but your UI should provide feedback:

```tsx
{todos.length === 0 ? (
  <p>No tasks. Press Ctrl+K to add a task.</p>
) : (
  <TaskList todos={todos} />
)}
```

### 4. Combine with Keyboard Shortcuts
Focus management works best when combined with keyboard shortcuts:

```tsx
const { focusedTask, focusNext, focusPrevious } = useFocusManagement(todos);

useKeyboardShortcuts([
  { key: 'ArrowDown', action: focusNext },
  { key: 'ArrowUp', action: focusPrevious },
  { key: 'Enter', action: () => focusedTask && openTask(focusedTask) },
]);
```

### 5. Scroll Focused Task into View
Use the `onFocusChange` callback to ensure the focused task is visible:

```tsx
useFocusManagement(todos, {
  onFocusChange: (task, index) => {
    document
      .querySelector(`[data-task-index="${index}"]`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  },
});
```

## Troubleshooting

### Focus doesn't move when pressing arrow keys
- Check that `useKeyboardShortcuts` is called with the navigation actions
- Verify that shortcuts are enabled (check `enabled` option)
- Ensure you're not typing in an input field (shortcuts are disabled in inputs)

### Visual indicator not showing
- Verify you're applying the focus styles based on `focusedTask`
- Check that your CSS classes are being applied correctly
- Use browser DevTools to inspect the element's classes

### Focus is lost when list updates
- The hook should maintain focus automatically
- Check that you're passing the correct task array
- Verify that task IDs are stable (don't change between renders)

### Focus wraps when it shouldn't (or vice versa)
- Check the `wrap` option in `useFocusManagement` options
- Default is `true` (wrapping enabled)

## Examples

See `useFocusManagement.example.tsx` for comprehensive examples including:
- Basic focus management
- Full keyboard shortcuts integration
- Auto-focus on filter changes
- Click-to-focus integration
- No wrapping mode
- Subtle focus styling
- Focus callbacks
- Multi-list focus management

## Integration with Phase 5.1

This hook is designed to work seamlessly with the `useKeyboardShortcuts` hook from Phase 5.1:

```tsx
import { useFocusManagement } from '@/hooks/useFocusManagement';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

function TodoList({ todos }) {
  const { focusedTask, focusNext, focusPrevious } = useFocusManagement(todos);

  useKeyboardShortcuts([
    { key: 'ArrowDown', description: 'Next task', action: focusNext },
    { key: 'ArrowUp', description: 'Previous task', action: focusPrevious },
    {
      key: 'e',
      description: 'Edit task',
      action: () => focusedTask && openEditDialog(focusedTask),
    },
  ]);

  // ... rest of component
}
```

## Related Documentation

- [useKeyboardShortcuts.README.md](./useKeyboardShortcuts.README.md) - Keyboard shortcuts implementation
- [ADVANCED_FEATURES_IMPLEMENTATION_PLAN.md](../../../ADVANCED_FEATURES_IMPLEMENTATION_PLAN.md) - Overall implementation plan
- [Phase 5 Implementation Plan](../../../ADVANCED_FEATURES_IMPLEMENTATION_PLAN.md#phase-5-keyboard-shortcuts) - Keyboard shortcuts phase

## License

This hook is part of the GoalConnect project.
