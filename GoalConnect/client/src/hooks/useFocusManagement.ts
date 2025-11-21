import { useState, useCallback, useEffect, useRef } from 'react';
import type { Todo } from '../../../shared/schema';

/**
 * Return type for the useFocusManagement hook
 */
export interface UseFocusManagementReturn {
  /** The current focused task index (null if no task is focused) */
  focusedIndex: number | null;
  /** The currently focused task object (null if no task is focused) */
  focusedTask: Todo | null;
  /** Move focus to the next task in the list */
  focusNext: () => void;
  /** Move focus to the previous task in the list */
  focusPrevious: () => void;
  /** Move focus to the first task in the list */
  focusFirst: () => void;
  /** Move focus to the last task in the list */
  focusLast: () => void;
  /** Set focus to a specific index */
  setFocusedIndex: (index: number | null) => void;
  /** Clear focus (set to null) */
  clearFocus: () => void;
  /** Set focus to a specific task ID */
  setFocusedTaskId: (taskId: number | null) => void;
}

/**
 * Options for the useFocusManagement hook
 */
export interface UseFocusManagementOptions {
  /** Enable wrapping at list boundaries (default: true) */
  wrap?: boolean;
  /** Auto-focus the first task when the list becomes non-empty (default: false) */
  autoFocusFirst?: boolean;
  /** Callback when focus changes */
  onFocusChange?: (task: Todo | null, index: number | null) => void;
}

/**
 * Custom hook for managing keyboard focus across a list of tasks
 *
 * This hook provides comprehensive focus management for task lists, including:
 * - Arrow key navigation (up/down)
 * - Wrapping at list boundaries
 * - Maintaining focus when the list changes (filtered, sorted, etc.)
 * - Auto-focusing the first task
 * - Tracking the focused task object
 *
 * The hook intelligently maintains focus when the task list changes:
 * - If a focused task is removed, focus moves to the next task
 * - If the list is filtered/sorted, focus stays on the same task if it's still in the list
 * - If the focused task is no longer in the list, focus is cleared
 *
 * @param tasks - Array of tasks to manage focus for
 * @param options - Configuration options for focus behavior
 *
 * @example
 * Basic usage with arrow key navigation:
 * ```tsx
 * const { focusedTask, focusNext, focusPrevious } = useFocusManagement(todos);
 *
 * // In your keyboard shortcut handler
 * useKeyboardShortcuts([
 *   {
 *     key: 'ArrowDown',
 *     description: 'Next task',
 *     action: focusNext,
 *   },
 *   {
 *     key: 'ArrowUp',
 *     description: 'Previous task',
 *     action: focusPrevious,
 *   },
 * ]);
 *
 * // Render with visual indicator
 * {todos.map((todo, index) => (
 *   <TodoItem
 *     key={todo.id}
 *     todo={todo}
 *     isFocused={focusedTask?.id === todo.id}
 *   />
 * ))}
 * ```
 *
 * @example
 * With wrapping disabled and auto-focus:
 * ```tsx
 * const { focusedTask, focusFirst, focusLast } = useFocusManagement(todos, {
 *   wrap: false,
 *   autoFocusFirst: true,
 *   onFocusChange: (task, index) => {
 *     console.log(`Focus changed to task ${task?.id} at index ${index}`);
 *   },
 * });
 * ```
 *
 * @example
 * Advanced usage with task actions:
 * ```tsx
 * const { focusedTask, focusNext, setFocusedTaskId } = useFocusManagement(todos);
 *
 * // Focus a specific task by ID
 * const handleTaskClick = (taskId: number) => {
 *   setFocusedTaskId(taskId);
 * };
 *
 * // Perform action on focused task
 * const handleDeleteFocused = () => {
 *   if (focusedTask) {
 *     deleteTodo(focusedTask.id);
 *     // Focus automatically moves to next task
 *   }
 * };
 * ```
 */
export function useFocusManagement(
  tasks: Todo[],
  options: UseFocusManagementOptions = {}
): UseFocusManagementReturn {
  const { wrap = true, autoFocusFirst = false, onFocusChange } = options;

  // State for tracking the currently focused index
  const [focusedIndex, setFocusedIndexState] = useState<number | null>(null);

  // Ref to track the last focused task ID for persistence across list changes
  const lastFocusedTaskIdRef = useRef<number | null>(null);

  // Ref to track if this is the initial mount
  const isInitialMountRef = useRef(true);

  // Get the currently focused task object
  const focusedTask = focusedIndex !== null && tasks[focusedIndex]
    ? tasks[focusedIndex]
    : null;

  /**
   * Internal function to update focused index with validation and callbacks
   */
  const updateFocusedIndex = useCallback((newIndex: number | null) => {
    // Validate index
    if (newIndex !== null) {
      if (newIndex < 0 || newIndex >= tasks.length) {
        // Invalid index, clear focus
        setFocusedIndexState(null);
        lastFocusedTaskIdRef.current = null;
        onFocusChange?.(null, null);
        return;
      }
    }

    // Update state
    setFocusedIndexState(newIndex);

    // Update last focused task ID ref
    if (newIndex !== null && tasks[newIndex]) {
      lastFocusedTaskIdRef.current = tasks[newIndex].id;
    } else {
      lastFocusedTaskIdRef.current = null;
    }

    // Call onChange callback
    const task = newIndex !== null && tasks[newIndex] ? tasks[newIndex] : null;
    onFocusChange?.(task, newIndex);
  }, [tasks, onFocusChange]);

  /**
   * Move focus to the next task in the list
   * Wraps to the first task if at the end (when wrap is enabled)
   */
  const focusNext = useCallback(() => {
    if (tasks.length === 0) return;

    if (focusedIndex === null) {
      // No focus yet, focus first item
      updateFocusedIndex(0);
    } else if (focusedIndex >= tasks.length - 1) {
      // At the end of the list
      if (wrap) {
        // Wrap to the beginning
        updateFocusedIndex(0);
      }
      // Otherwise stay at the last item (do nothing)
    } else {
      // Move to next item
      updateFocusedIndex(focusedIndex + 1);
    }
  }, [tasks.length, focusedIndex, wrap, updateFocusedIndex]);

  /**
   * Move focus to the previous task in the list
   * Wraps to the last task if at the beginning (when wrap is enabled)
   */
  const focusPrevious = useCallback(() => {
    if (tasks.length === 0) return;

    if (focusedIndex === null) {
      // No focus yet, focus last item
      updateFocusedIndex(tasks.length - 1);
    } else if (focusedIndex <= 0) {
      // At the beginning of the list
      if (wrap) {
        // Wrap to the end
        updateFocusedIndex(tasks.length - 1);
      }
      // Otherwise stay at the first item (do nothing)
    } else {
      // Move to previous item
      updateFocusedIndex(focusedIndex - 1);
    }
  }, [tasks.length, focusedIndex, wrap, updateFocusedIndex]);

  /**
   * Move focus to the first task in the list
   */
  const focusFirst = useCallback(() => {
    if (tasks.length > 0) {
      updateFocusedIndex(0);
    }
  }, [tasks.length, updateFocusedIndex]);

  /**
   * Move focus to the last task in the list
   */
  const focusLast = useCallback(() => {
    if (tasks.length > 0) {
      updateFocusedIndex(tasks.length - 1);
    }
  }, [tasks.length, updateFocusedIndex]);

  /**
   * Set focus to a specific index
   * Validates the index and clears focus if invalid
   */
  const setFocusedIndex = useCallback((index: number | null) => {
    updateFocusedIndex(index);
  }, [updateFocusedIndex]);

  /**
   * Clear focus (set to null)
   */
  const clearFocus = useCallback(() => {
    updateFocusedIndex(null);
  }, [updateFocusedIndex]);

  /**
   * Set focus to a specific task by ID
   * Searches for the task in the list and focuses it
   */
  const setFocusedTaskId = useCallback((taskId: number | null) => {
    if (taskId === null) {
      clearFocus();
      return;
    }

    const index = tasks.findIndex(task => task.id === taskId);
    if (index !== -1) {
      updateFocusedIndex(index);
    } else {
      // Task not found, clear focus
      clearFocus();
    }
  }, [tasks, updateFocusedIndex, clearFocus]);

  /**
   * Effect: Auto-focus first task on initial mount if enabled
   */
  useEffect(() => {
    if (isInitialMountRef.current && autoFocusFirst && tasks.length > 0) {
      updateFocusedIndex(0);
    }
    isInitialMountRef.current = false;
  }, [autoFocusFirst, tasks.length, updateFocusedIndex]);

  /**
   * Effect: Maintain focus when task list changes
   * This handles filtering, sorting, and task deletion
   */
  useEffect(() => {
    // Skip on initial mount
    if (isInitialMountRef.current) return;

    // If no task was focused, nothing to maintain
    if (lastFocusedTaskIdRef.current === null) return;

    // If the list is empty, clear focus
    if (tasks.length === 0) {
      updateFocusedIndex(null);
      return;
    }

    // Try to find the previously focused task in the updated list
    const newIndex = tasks.findIndex(task => task.id === lastFocusedTaskIdRef.current);

    if (newIndex !== -1) {
      // Task still exists in the list, update the index
      if (newIndex !== focusedIndex) {
        setFocusedIndexState(newIndex);
      }
    } else {
      // Task no longer exists in the list
      if (focusedIndex !== null) {
        // Try to focus the task at the same index, or the last task if we were at the end
        const nextIndex = Math.min(focusedIndex, tasks.length - 1);
        updateFocusedIndex(nextIndex);
      } else {
        // Just clear focus
        updateFocusedIndex(null);
      }
    }
  }, [tasks, focusedIndex, updateFocusedIndex]);

  return {
    focusedIndex,
    focusedTask,
    focusNext,
    focusPrevious,
    focusFirst,
    focusLast,
    setFocusedIndex,
    clearFocus,
    setFocusedTaskId,
  };
}

/**
 * Helper function to check if a task is focused
 * Useful for applying visual styles to focused tasks
 *
 * @param task - The task to check
 * @param focusedTask - The currently focused task from useFocusManagement
 * @returns true if the task is focused
 *
 * @example
 * ```tsx
 * const { focusedTask } = useFocusManagement(todos);
 *
 * <div
 *   className={cn(
 *     "task-item",
 *     isTaskFocused(todo, focusedTask) && "ring-2 ring-blue-500"
 *   )}
 * >
 *   {todo.title}
 * </div>
 * ```
 */
export function isTaskFocused(task: Todo, focusedTask: Todo | null): boolean {
  return focusedTask?.id === task.id;
}

/**
 * Default focus ring styles for focused tasks
 * Use these in your task component for consistent styling
 *
 * @example
 * ```tsx
 * import { FOCUS_RING_STYLES } from '@/hooks/useFocusManagement';
 *
 * <div className={cn("task-item", isFocused && FOCUS_RING_STYLES)}>
 *   {todo.title}
 * </div>
 * ```
 */
export const FOCUS_RING_STYLES = "ring-2 ring-blue-500 ring-offset-2 ring-offset-background";

/**
 * Alternative focus styles for a more subtle appearance
 */
export const SUBTLE_FOCUS_STYLES = "bg-accent/50 border-l-4 border-blue-500";
