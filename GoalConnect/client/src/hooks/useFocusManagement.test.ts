import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFocusManagement, isTaskFocused } from './useFocusManagement';
import type { Todo } from '../../../shared/schema';

// Helper to create mock todos
const createMockTodo = (id: number, title: string = `Task ${id}`): Todo => ({
  id,
  title,
  completed: false,
  userId: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
  description: null,
  priority: null,
  dueDate: null,
  projectId: null,
  parentId: null,
  order: id,
  estimatedMinutes: null,
  actualMinutes: null,
  recurrencePattern: null,
  lastRecurrenceDate: null,
  recurrenceCount: null,
});

describe('useFocusManagement', () => {
  describe('initial state', () => {
    it('starts with no focused task', () => {
      const todos = [createMockTodo(1), createMockTodo(2)];
      const { result } = renderHook(() => useFocusManagement(todos));

      expect(result.current.focusedIndex).toBeNull();
      expect(result.current.focusedTask).toBeNull();
    });

    it('auto-focuses first task when autoFocusFirst is enabled', () => {
      const todos = [createMockTodo(1), createMockTodo(2)];
      const { result } = renderHook(() =>
        useFocusManagement(todos, { autoFocusFirst: true })
      );

      expect(result.current.focusedIndex).toBe(0);
      expect(result.current.focusedTask).toEqual(todos[0]);
    });

    it('does not auto-focus when list is empty', () => {
      const { result } = renderHook(() =>
        useFocusManagement([], { autoFocusFirst: true })
      );

      expect(result.current.focusedIndex).toBeNull();
      expect(result.current.focusedTask).toBeNull();
    });
  });

  describe('focusNext', () => {
    it('focuses first task when no task is focused', () => {
      const todos = [createMockTodo(1), createMockTodo(2), createMockTodo(3)];
      const { result } = renderHook(() => useFocusManagement(todos));

      act(() => {
        result.current.focusNext();
      });

      expect(result.current.focusedIndex).toBe(0);
      expect(result.current.focusedTask?.id).toBe(1);
    });

    it('moves focus to next task', () => {
      const todos = [createMockTodo(1), createMockTodo(2), createMockTodo(3)];
      const { result } = renderHook(() => useFocusManagement(todos));

      act(() => {
        result.current.setFocusedIndex(0);
      });

      act(() => {
        result.current.focusNext();
      });

      expect(result.current.focusedIndex).toBe(1);
      expect(result.current.focusedTask?.id).toBe(2);
    });

    it('wraps to first task when at end (wrap enabled)', () => {
      const todos = [createMockTodo(1), createMockTodo(2), createMockTodo(3)];
      const { result } = renderHook(() => useFocusManagement(todos, { wrap: true }));

      act(() => {
        result.current.setFocusedIndex(2); // Last task
      });

      act(() => {
        result.current.focusNext();
      });

      expect(result.current.focusedIndex).toBe(0);
      expect(result.current.focusedTask?.id).toBe(1);
    });

    it('stays at last task when at end (wrap disabled)', () => {
      const todos = [createMockTodo(1), createMockTodo(2), createMockTodo(3)];
      const { result } = renderHook(() => useFocusManagement(todos, { wrap: false }));

      act(() => {
        result.current.setFocusedIndex(2); // Last task
      });

      act(() => {
        result.current.focusNext();
      });

      expect(result.current.focusedIndex).toBe(2);
      expect(result.current.focusedTask?.id).toBe(3);
    });

    it('does nothing when list is empty', () => {
      const { result } = renderHook(() => useFocusManagement([]));

      act(() => {
        result.current.focusNext();
      });

      expect(result.current.focusedIndex).toBeNull();
      expect(result.current.focusedTask).toBeNull();
    });
  });

  describe('focusPrevious', () => {
    it('focuses last task when no task is focused', () => {
      const todos = [createMockTodo(1), createMockTodo(2), createMockTodo(3)];
      const { result } = renderHook(() => useFocusManagement(todos));

      act(() => {
        result.current.focusPrevious();
      });

      expect(result.current.focusedIndex).toBe(2);
      expect(result.current.focusedTask?.id).toBe(3);
    });

    it('moves focus to previous task', () => {
      const todos = [createMockTodo(1), createMockTodo(2), createMockTodo(3)];
      const { result } = renderHook(() => useFocusManagement(todos));

      act(() => {
        result.current.setFocusedIndex(2);
      });

      act(() => {
        result.current.focusPrevious();
      });

      expect(result.current.focusedIndex).toBe(1);
      expect(result.current.focusedTask?.id).toBe(2);
    });

    it('wraps to last task when at beginning (wrap enabled)', () => {
      const todos = [createMockTodo(1), createMockTodo(2), createMockTodo(3)];
      const { result } = renderHook(() => useFocusManagement(todos, { wrap: true }));

      act(() => {
        result.current.setFocusedIndex(0); // First task
      });

      act(() => {
        result.current.focusPrevious();
      });

      expect(result.current.focusedIndex).toBe(2);
      expect(result.current.focusedTask?.id).toBe(3);
    });

    it('stays at first task when at beginning (wrap disabled)', () => {
      const todos = [createMockTodo(1), createMockTodo(2), createMockTodo(3)];
      const { result } = renderHook(() => useFocusManagement(todos, { wrap: false }));

      act(() => {
        result.current.setFocusedIndex(0); // First task
      });

      act(() => {
        result.current.focusPrevious();
      });

      expect(result.current.focusedIndex).toBe(0);
      expect(result.current.focusedTask?.id).toBe(1);
    });
  });

  describe('focusFirst and focusLast', () => {
    it('focuses first task', () => {
      const todos = [createMockTodo(1), createMockTodo(2), createMockTodo(3)];
      const { result } = renderHook(() => useFocusManagement(todos));

      act(() => {
        result.current.setFocusedIndex(2);
      });

      act(() => {
        result.current.focusFirst();
      });

      expect(result.current.focusedIndex).toBe(0);
      expect(result.current.focusedTask?.id).toBe(1);
    });

    it('focuses last task', () => {
      const todos = [createMockTodo(1), createMockTodo(2), createMockTodo(3)];
      const { result } = renderHook(() => useFocusManagement(todos));

      act(() => {
        result.current.focusLast();
      });

      expect(result.current.focusedIndex).toBe(2);
      expect(result.current.focusedTask?.id).toBe(3);
    });

    it('handles empty list gracefully', () => {
      const { result } = renderHook(() => useFocusManagement([]));

      act(() => {
        result.current.focusFirst();
      });

      expect(result.current.focusedIndex).toBeNull();

      act(() => {
        result.current.focusLast();
      });

      expect(result.current.focusedIndex).toBeNull();
    });
  });

  describe('setFocusedTaskId', () => {
    it('focuses task by ID', () => {
      const todos = [createMockTodo(1), createMockTodo(2), createMockTodo(3)];
      const { result } = renderHook(() => useFocusManagement(todos));

      act(() => {
        result.current.setFocusedTaskId(2);
      });

      expect(result.current.focusedIndex).toBe(1);
      expect(result.current.focusedTask?.id).toBe(2);
    });

    it('clears focus when task ID not found', () => {
      const todos = [createMockTodo(1), createMockTodo(2), createMockTodo(3)];
      const { result } = renderHook(() => useFocusManagement(todos));

      act(() => {
        result.current.setFocusedTaskId(1);
      });

      expect(result.current.focusedTask?.id).toBe(1);

      act(() => {
        result.current.setFocusedTaskId(999); // Non-existent ID
      });

      expect(result.current.focusedIndex).toBeNull();
      expect(result.current.focusedTask).toBeNull();
    });

    it('clears focus when null is passed', () => {
      const todos = [createMockTodo(1), createMockTodo(2), createMockTodo(3)];
      const { result } = renderHook(() => useFocusManagement(todos));

      act(() => {
        result.current.setFocusedTaskId(1);
      });

      expect(result.current.focusedTask?.id).toBe(1);

      act(() => {
        result.current.setFocusedTaskId(null);
      });

      expect(result.current.focusedIndex).toBeNull();
      expect(result.current.focusedTask).toBeNull();
    });
  });

  describe('clearFocus', () => {
    it('clears focus', () => {
      const todos = [createMockTodo(1), createMockTodo(2), createMockTodo(3)];
      const { result } = renderHook(() => useFocusManagement(todos));

      act(() => {
        result.current.setFocusedIndex(1);
      });

      expect(result.current.focusedTask?.id).toBe(2);

      act(() => {
        result.current.clearFocus();
      });

      expect(result.current.focusedIndex).toBeNull();
      expect(result.current.focusedTask).toBeNull();
    });
  });

  describe('onFocusChange callback', () => {
    it('calls callback when focus changes', () => {
      const onFocusChange = vi.fn();
      const todos = [createMockTodo(1), createMockTodo(2), createMockTodo(3)];
      const { result } = renderHook(() =>
        useFocusManagement(todos, { onFocusChange })
      );

      act(() => {
        result.current.setFocusedIndex(1);
      });

      expect(onFocusChange).toHaveBeenCalledWith(todos[1], 1);
    });

    it('calls callback with null when focus is cleared', () => {
      const onFocusChange = vi.fn();
      const todos = [createMockTodo(1), createMockTodo(2), createMockTodo(3)];
      const { result } = renderHook(() =>
        useFocusManagement(todos, { onFocusChange })
      );

      act(() => {
        result.current.setFocusedIndex(1);
      });

      onFocusChange.mockClear();

      act(() => {
        result.current.clearFocus();
      });

      expect(onFocusChange).toHaveBeenCalledWith(null, null);
    });
  });

  describe('focus persistence across list changes', () => {
    it('maintains focus on same task when list is reordered', () => {
      const todos = [createMockTodo(1), createMockTodo(2), createMockTodo(3)];
      const { result, rerender } = renderHook(
        ({ tasks }) => useFocusManagement(tasks),
        { initialProps: { tasks: todos } }
      );

      act(() => {
        result.current.setFocusedTaskId(2);
      });

      expect(result.current.focusedIndex).toBe(1);

      // Reorder tasks
      const reorderedTodos = [createMockTodo(3), createMockTodo(2), createMockTodo(1)];
      rerender({ tasks: reorderedTodos });

      // Focus should move to new index but same task
      expect(result.current.focusedIndex).toBe(1);
      expect(result.current.focusedTask?.id).toBe(2);
    });

    it('clears focus when focused task is removed', () => {
      const todos = [createMockTodo(1), createMockTodo(2), createMockTodo(3)];
      const { result, rerender } = renderHook(
        ({ tasks }) => useFocusManagement(tasks),
        { initialProps: { tasks: todos } }
      );

      act(() => {
        result.current.setFocusedTaskId(2);
      });

      expect(result.current.focusedTask?.id).toBe(2);

      // Remove focused task
      const filteredTodos = [createMockTodo(1), createMockTodo(3)];
      rerender({ tasks: filteredTodos });

      // Should focus task at same index (task 3)
      expect(result.current.focusedIndex).toBe(1);
      expect(result.current.focusedTask?.id).toBe(3);
    });

    it('clears focus when list becomes empty', () => {
      const todos = [createMockTodo(1), createMockTodo(2)];
      const { result, rerender } = renderHook(
        ({ tasks }) => useFocusManagement(tasks),
        { initialProps: { tasks: todos } }
      );

      act(() => {
        result.current.setFocusedTaskId(1);
      });

      expect(result.current.focusedTask?.id).toBe(1);

      // Empty the list
      rerender({ tasks: [] });

      expect(result.current.focusedIndex).toBeNull();
      expect(result.current.focusedTask).toBeNull();
    });

    it('adjusts index when focused task was at end and list shrinks', () => {
      const todos = [createMockTodo(1), createMockTodo(2), createMockTodo(3)];
      const { result, rerender } = renderHook(
        ({ tasks }) => useFocusManagement(tasks),
        { initialProps: { tasks: todos } }
      );

      act(() => {
        result.current.setFocusedIndex(2);
      });

      expect(result.current.focusedTask?.id).toBe(3);

      // Remove last task
      const shorterTodos = [createMockTodo(1), createMockTodo(2)];
      rerender({ tasks: shorterTodos });

      // Should focus new last task
      expect(result.current.focusedIndex).toBe(1);
      expect(result.current.focusedTask?.id).toBe(2);
    });
  });

  describe('edge cases', () => {
    it('handles invalid index', () => {
      const todos = [createMockTodo(1), createMockTodo(2), createMockTodo(3)];
      const { result } = renderHook(() => useFocusManagement(todos));

      act(() => {
        result.current.setFocusedIndex(999);
      });

      expect(result.current.focusedIndex).toBeNull();
      expect(result.current.focusedTask).toBeNull();
    });

    it('handles negative index', () => {
      const todos = [createMockTodo(1), createMockTodo(2), createMockTodo(3)];
      const { result } = renderHook(() => useFocusManagement(todos));

      act(() => {
        result.current.setFocusedIndex(-1);
      });

      expect(result.current.focusedIndex).toBeNull();
      expect(result.current.focusedTask).toBeNull();
    });
  });
});

describe('isTaskFocused', () => {
  it('returns true when task is focused', () => {
    const task = createMockTodo(1);
    expect(isTaskFocused(task, task)).toBe(true);
  });

  it('returns false when different task is focused', () => {
    const task1 = createMockTodo(1);
    const task2 = createMockTodo(2);
    expect(isTaskFocused(task1, task2)).toBe(false);
  });

  it('returns false when no task is focused', () => {
    const task = createMockTodo(1);
    expect(isTaskFocused(task, null)).toBe(false);
  });

  it('compares by ID, not reference', () => {
    const task1 = createMockTodo(1);
    const task2 = { ...task1 }; // Same ID, different reference
    expect(isTaskFocused(task1, task2)).toBe(true);
  });
});
