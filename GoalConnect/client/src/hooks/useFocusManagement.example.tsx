/**
 * useFocusManagement Hook - Example Usage
 *
 * This file demonstrates various ways to use the useFocusManagement hook
 * for implementing keyboard navigation in task lists.
 */

import React from 'react';
import { useFocusManagement, isTaskFocused, FOCUS_RING_STYLES } from './useFocusManagement';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';
import type { Todo } from '../../../shared/schema';
import { cn } from '@/lib/utils';

/**
 * Example 1: Basic Focus Management with Arrow Keys
 *
 * This example shows the simplest implementation - just arrow key navigation
 * with visual focus indicators.
 */
export function BasicFocusExample({ todos }: { todos: Todo[] }) {
  // Initialize focus management with wrapping enabled
  const { focusedTask, focusNext, focusPrevious } = useFocusManagement(todos, {
    wrap: true,
  });

  // Set up keyboard shortcuts for navigation
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
    <div className="space-y-2">
      {todos.map((todo) => (
        <div
          key={todo.id}
          className={cn(
            'p-4 rounded-lg border bg-card',
            // Apply focus ring when this task is focused
            isTaskFocused(todo, focusedTask) && FOCUS_RING_STYLES
          )}
        >
          <h3>{todo.title}</h3>
          <p className="text-sm text-muted-foreground">
            Due: {todo.dueDate || 'No date'}
          </p>
        </div>
      ))}
    </div>
  );
}

/**
 * Example 2: Full Keyboard Shortcuts Integration
 *
 * This example demonstrates a complete implementation with all keyboard
 * shortcuts for task management.
 */
export function FullKeyboardExample({
  todos,
  onEdit,
  onDelete,
  onToggleComplete,
  onSetPriority,
}: {
  todos: Todo[];
  onEdit: (todo: Todo) => void;
  onDelete: (todo: Todo) => void;
  onToggleComplete: (todo: Todo) => void;
  onSetPriority: (todo: Todo, priority: number) => void;
}) {
  const {
    focusedTask,
    focusNext,
    focusPrevious,
    focusFirst,
    focusLast,
  } = useFocusManagement(todos, {
    wrap: true,
    onFocusChange: (task, index) => {
      console.log(`Focus changed to task at index ${index}:`, task?.title);
    },
  });

  // Define all keyboard shortcuts
  useKeyboardShortcuts([
    // Navigation
    {
      key: 'ArrowDown',
      description: 'Next task',
      action: focusNext,
    },
    {
      key: 'ArrowUp',
      description: 'Previous task',
      action: focusPrevious,
    },
    {
      key: 'Home',
      description: 'First task',
      action: focusFirst,
    },
    {
      key: 'End',
      description: 'Last task',
      action: focusLast,
    },

    // Actions on focused task
    {
      key: 'Enter',
      description: 'Edit focused task',
      action: () => focusedTask && onEdit(focusedTask),
    },
    {
      key: 'e',
      description: 'Edit focused task',
      action: () => focusedTask && onEdit(focusedTask),
    },
    {
      key: ' ', // Space
      description: 'Toggle completion',
      action: () => focusedTask && onToggleComplete(focusedTask),
    },
    {
      key: 'Delete',
      description: 'Delete focused task',
      action: () => focusedTask && onDelete(focusedTask),
    },
    {
      key: 'Backspace',
      description: 'Delete focused task',
      action: () => focusedTask && onDelete(focusedTask),
    },

    // Priority shortcuts
    {
      key: '1',
      description: 'Set priority to P1',
      action: () => focusedTask && onSetPriority(focusedTask, 1),
    },
    {
      key: '2',
      description: 'Set priority to P2',
      action: () => focusedTask && onSetPriority(focusedTask, 2),
    },
    {
      key: '3',
      description: 'Set priority to P3',
      action: () => focusedTask && onSetPriority(focusedTask, 3),
    },
    {
      key: '4',
      description: 'Set priority to P4',
      action: () => focusedTask && onSetPriority(focusedTask, 4),
    },
  ]);

  return (
    <div className="space-y-2">
      <div className="text-sm text-muted-foreground mb-4">
        {focusedTask ? (
          <p>Focused: {focusedTask.title}</p>
        ) : (
          <p>No task focused. Press ↑ or ↓ to navigate.</p>
        )}
      </div>

      {todos.map((todo) => {
        const isFocused = isTaskFocused(todo, focusedTask);

        return (
          <div
            key={todo.id}
            data-testid="task-item"
            data-task-id={todo.id}
            data-focused={isFocused ? 'true' : undefined}
            className={cn(
              'p-4 rounded-lg border bg-card transition-all',
              isFocused && FOCUS_RING_STYLES
            )}
          >
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => onToggleComplete(todo)}
                className="h-4 w-4"
              />
              <div className="flex-1">
                <h3 className={cn(todo.completed && 'line-through')}>
                  {todo.title}
                </h3>
                {todo.dueDate && (
                  <p className="text-sm text-muted-foreground">
                    Due: {todo.dueDate}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  P{todo.priority}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Example 3: Auto-Focus on Filter Changes
 *
 * This example shows how to auto-focus the first task when applying filters.
 */
export function AutoFocusFilterExample({
  todos,
  filter,
}: {
  todos: Todo[];
  filter: string;
}) {
  const { focusedTask, focusNext, focusPrevious } = useFocusManagement(todos, {
    wrap: true,
    // Auto-focus first task when filter changes (list becomes non-empty)
    autoFocusFirst: true,
  });

  useKeyboardShortcuts([
    {
      key: 'ArrowDown',
      description: 'Next task',
      action: focusNext,
    },
    {
      key: 'ArrowUp',
      description: 'Previous task',
      action: focusPrevious,
    },
  ]);

  return (
    <div>
      <div className="mb-4">
        <p className="text-sm">
          Filter: <strong>{filter}</strong>
        </p>
        <p className="text-xs text-muted-foreground">
          First task auto-focuses when filter is applied
        </p>
      </div>

      <div className="space-y-2">
        {todos.map((todo) => (
          <div
            key={todo.id}
            data-testid="task-item"
            className={cn(
              'p-4 rounded-lg border bg-card',
              isTaskFocused(todo, focusedTask) && FOCUS_RING_STYLES
            )}
          >
            {todo.title}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Example 4: Click-to-Focus Integration
 *
 * This example combines keyboard and mouse interaction - clicking a task
 * focuses it, and then keyboard shortcuts work on the clicked task.
 */
export function ClickToFocusExample({ todos }: { todos: Todo[] }) {
  const {
    focusedTask,
    focusNext,
    focusPrevious,
    setFocusedTaskId,
    clearFocus,
  } = useFocusManagement(todos);

  useKeyboardShortcuts([
    {
      key: 'ArrowDown',
      description: 'Next task',
      action: focusNext,
    },
    {
      key: 'ArrowUp',
      description: 'Previous task',
      action: focusPrevious,
    },
    {
      key: 'Escape',
      description: 'Clear focus',
      action: clearFocus,
    },
  ]);

  return (
    <div className="space-y-2">
      {todos.map((todo) => (
        <div
          key={todo.id}
          data-testid="task-item"
          onClick={() => setFocusedTaskId(todo.id)}
          className={cn(
            'p-4 rounded-lg border bg-card cursor-pointer',
            'hover:bg-accent/50 transition-colors',
            isTaskFocused(todo, focusedTask) && FOCUS_RING_STYLES
          )}
        >
          <h3>{todo.title}</h3>
          <p className="text-xs text-muted-foreground">
            Click to focus, or use ↑↓ to navigate
          </p>
        </div>
      ))}
    </div>
  );
}

/**
 * Example 5: No Wrapping Mode
 *
 * This example disables wrapping - when at the end of the list,
 * arrow down does nothing (stays on last item).
 */
export function NoWrapExample({ todos }: { todos: Todo[] }) {
  const { focusedTask, focusedIndex, focusNext, focusPrevious } = useFocusManagement(
    todos,
    {
      wrap: false, // Disable wrapping
    }
  );

  useKeyboardShortcuts([
    {
      key: 'ArrowDown',
      description: 'Next task',
      action: focusNext,
    },
    {
      key: 'ArrowUp',
      description: 'Previous task',
      action: focusPrevious,
    },
  ]);

  return (
    <div>
      <div className="mb-4 text-sm">
        <p>Wrapping disabled - navigation stops at list boundaries</p>
        <p className="text-muted-foreground">
          Position: {focusedIndex !== null ? focusedIndex + 1 : 'None'} of {todos.length}
        </p>
      </div>

      <div className="space-y-2">
        {todos.map((todo, index) => (
          <div
            key={todo.id}
            data-testid="task-item"
            className={cn(
              'p-4 rounded-lg border bg-card',
              isTaskFocused(todo, focusedTask) && FOCUS_RING_STYLES
            )}
          >
            <span className="text-xs text-muted-foreground mr-2">
              {index + 1}.
            </span>
            {todo.title}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Example 6: Subtle Focus Styling
 *
 * This example uses a more subtle focus indicator instead of the
 * default focus ring.
 */
export function SubtleFocusExample({ todos }: { todos: Todo[] }) {
  const { focusedTask, focusNext, focusPrevious } = useFocusManagement(todos);

  useKeyboardShortcuts([
    {
      key: 'ArrowDown',
      description: 'Next task',
      action: focusNext,
    },
    {
      key: 'ArrowUp',
      description: 'Previous task',
      action: focusPrevious,
    },
  ]);

  return (
    <div className="space-y-2">
      {todos.map((todo) => (
        <div
          key={todo.id}
          data-testid="task-item"
          className={cn(
            'p-4 rounded-lg border bg-card transition-all',
            // Subtle focus style instead of ring
            isTaskFocused(todo, focusedTask) && 'bg-accent/50 border-l-4 border-blue-500'
          )}
        >
          {todo.title}
        </div>
      ))}
    </div>
  );
}

/**
 * Example 7: Focus Management with Custom Callback
 *
 * This example uses the onFocusChange callback to perform side effects
 * when focus changes (e.g., scrolling focused item into view, analytics).
 */
export function FocusCallbackExample({ todos }: { todos: Todo[] }) {
  const { focusedTask, focusNext, focusPrevious } = useFocusManagement(todos, {
    wrap: true,
    onFocusChange: (task, index) => {
      // Log for analytics
      console.log('Focus changed:', { taskId: task?.id, index });

      // Scroll focused item into view
      if (index !== null) {
        const element = document.querySelector(
          `[data-task-index="${index}"]`
        );
        element?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }

      // Could also trigger other side effects:
      // - Update URL query params
      // - Show task preview panel
      // - Load related data
      // - Update breadcrumbs
    },
  });

  useKeyboardShortcuts([
    {
      key: 'ArrowDown',
      description: 'Next task',
      action: focusNext,
    },
    {
      key: 'ArrowUp',
      description: 'Previous task',
      action: focusPrevious,
    },
  ]);

  return (
    <div className="space-y-2 max-h-96 overflow-y-auto">
      {todos.map((todo, index) => (
        <div
          key={todo.id}
          data-testid="task-item"
          data-task-index={index}
          className={cn(
            'p-4 rounded-lg border bg-card',
            isTaskFocused(todo, focusedTask) && FOCUS_RING_STYLES
          )}
        >
          {todo.title}
        </div>
      ))}
    </div>
  );
}

/**
 * Example 8: Multi-List Focus Management
 *
 * This example shows how to use multiple focus management hooks
 * for different sections (e.g., today's tasks vs upcoming tasks).
 */
export function MultiListExample({
  todayTasks,
  upcomingTasks,
}: {
  todayTasks: Todo[];
  upcomingTasks: Todo[];
}) {
  const [activeList, setActiveList] = React.useState<'today' | 'upcoming'>('today');

  const todayFocus = useFocusManagement(todayTasks);
  const upcomingFocus = useFocusManagement(upcomingTasks);

  // Switch which list gets keyboard focus
  const activeFocus = activeList === 'today' ? todayFocus : upcomingFocus;

  useKeyboardShortcuts([
    {
      key: 'ArrowDown',
      description: 'Next task',
      action: activeFocus.focusNext,
    },
    {
      key: 'ArrowUp',
      description: 'Previous task',
      action: activeFocus.focusPrevious,
    },
    {
      key: 'Tab',
      description: 'Switch lists',
      action: () => {
        setActiveList((prev) => (prev === 'today' ? 'upcoming' : 'today'));
      },
    },
  ]);

  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <h2 className="text-lg font-semibold mb-2">
          Today {activeList === 'today' && '(Active)'}
        </h2>
        <div className="space-y-2">
          {todayTasks.map((todo) => (
            <div
              key={todo.id}
              data-testid="task-item"
              className={cn(
                'p-4 rounded-lg border bg-card',
                isTaskFocused(todo, todayFocus.focusedTask) && FOCUS_RING_STYLES
              )}
            >
              {todo.title}
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-2">
          Upcoming {activeList === 'upcoming' && '(Active)'}
        </h2>
        <div className="space-y-2">
          {upcomingTasks.map((todo) => (
            <div
              key={todo.id}
              data-testid="task-item"
              className={cn(
                'p-4 rounded-lg border bg-card',
                isTaskFocused(todo, upcomingFocus.focusedTask) && FOCUS_RING_STYLES
              )}
            >
              {todo.title}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
