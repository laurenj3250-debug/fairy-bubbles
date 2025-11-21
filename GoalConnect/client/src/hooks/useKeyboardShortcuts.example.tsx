/**
 * Example usage of the useKeyboardShortcuts hook
 *
 * This file demonstrates how to use the keyboard shortcuts hook in your components.
 * It can serve as a reference implementation for integrating keyboard shortcuts
 * into the GoalConnect application.
 */

import { useKeyboardShortcuts, formatShortcut, DefaultShortcuts, KeyboardShortcut } from './useKeyboardShortcuts';
import { useState } from 'react';

/**
 * Example 1: Basic usage with explicit shortcuts array
 */
export function TodoListWithShortcuts() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Define all keyboard shortcuts
  const shortcuts: KeyboardShortcut[] = [
    // Quick Add (⌘K / Ctrl+K)
    {
      ...DefaultShortcuts.QUICK_ADD,
      description: 'Open quick add task dialog',
      action: () => setIsQuickAddOpen(true),
    },

    // Navigation
    {
      ...DefaultShortcuts.NAVIGATE_UP,
      description: 'Navigate to previous task',
      action: () => setSelectedIndex((prev) => Math.max(0, prev - 1)),
    },
    {
      ...DefaultShortcuts.NAVIGATE_DOWN,
      description: 'Navigate to next task',
      action: () => setSelectedIndex((prev) => prev + 1),
    },

    // Task Actions
    {
      ...DefaultShortcuts.OPEN_TASK,
      description: 'Open selected task',
      action: () => console.log('Opening task:', selectedIndex),
    },
    {
      ...DefaultShortcuts.EDIT_TASK,
      description: 'Edit selected task',
      action: () => console.log('Editing task:', selectedIndex),
    },
    {
      ...DefaultShortcuts.DELETE_TASK,
      description: 'Delete selected task',
      action: () => {
        if (confirm('Delete this task?')) {
          console.log('Deleting task:', selectedIndex);
        }
      },
    },
    {
      ...DefaultShortcuts.DELETE_TASK_ALT,
      description: 'Delete selected task (alternative)',
      action: () => {
        if (confirm('Delete this task?')) {
          console.log('Deleting task:', selectedIndex);
        }
      },
    },
    {
      ...DefaultShortcuts.TOGGLE_COMPLETE,
      description: 'Toggle task completion',
      action: () => console.log('Toggling task:', selectedIndex),
    },

    // Priority shortcuts
    {
      ...DefaultShortcuts.PRIORITY_1,
      description: 'Set priority to Urgent',
      action: () => console.log('Setting priority to 1'),
    },
    {
      ...DefaultShortcuts.PRIORITY_2,
      description: 'Set priority to High',
      action: () => console.log('Setting priority to 2'),
    },
    {
      ...DefaultShortcuts.PRIORITY_3,
      description: 'Set priority to Medium',
      action: () => console.log('Setting priority to 3'),
    },
    {
      ...DefaultShortcuts.PRIORITY_4,
      description: 'Set priority to Low',
      action: () => console.log('Setting priority to 4'),
    },

    // Selectors
    {
      ...DefaultShortcuts.PROJECT_SELECTOR,
      description: 'Open project selector',
      action: () => console.log('Opening project selector'),
    },
    {
      ...DefaultShortcuts.LABELS_SELECTOR,
      description: 'Open labels selector',
      action: () => console.log('Opening labels selector'),
    },
    {
      ...DefaultShortcuts.DUE_DATE,
      description: 'Set due date',
      action: () => console.log('Opening due date picker'),
    },

    // Help and Modal
    {
      ...DefaultShortcuts.HELP,
      description: 'Show keyboard shortcuts help',
      action: () => setIsHelpOpen(true),
    },
    {
      ...DefaultShortcuts.CLOSE_MODAL,
      description: 'Close any open modal',
      action: () => {
        setIsQuickAddOpen(false);
        setIsHelpOpen(false);
      },
    },
  ];

  // Use the hook
  const { platform } = useKeyboardShortcuts(shortcuts, {
    enabled: true,
    enableInInputs: false,
  });

  return (
    <div className="p-4">
      <div className="mb-4 text-sm text-gray-600">
        Platform: {platform.isMac ? 'Mac' : platform.isWindows ? 'Windows' : 'Linux'}
        <br />
        Modifier Key: {platform.modifierKey}
      </div>

      <div className="space-y-4">
        {/* Task list would go here */}
        <div>Selected Task Index: {selectedIndex}</div>

        {/* Quick Add Modal */}
        {isQuickAddOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg">
              <h2 className="text-xl mb-4">Quick Add Task</h2>
              <input
                type="text"
                placeholder="Task title..."
                className="border p-2 rounded w-full"
                autoFocus
              />
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setIsQuickAddOpen(false)}
                  className="px-4 py-2 bg-blue-500 text-white rounded"
                >
                  Add
                </button>
                <button
                  onClick={() => setIsQuickAddOpen(false)}
                  className="px-4 py-2 border rounded"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Help Modal */}
        {isHelpOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg max-w-2xl max-h-[80vh] overflow-auto">
              <h2 className="text-2xl mb-4">Keyboard Shortcuts</h2>
              <KeyboardShortcutsHelp shortcuts={shortcuts} />
              <button
                onClick={() => setIsHelpOpen(false)}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Example 2: Conditional shortcuts based on context
 */
export function ContextualShortcuts() {
  const [hasTaskSelected, setHasTaskSelected] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Only enable certain shortcuts when conditions are met
  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'e',
      description: 'Edit task',
      action: () => {
        if (hasTaskSelected) {
          setIsEditMode(true);
        }
      },
    },
    {
      key: 'Escape',
      description: 'Cancel edit',
      action: () => setIsEditMode(false),
    },
  ];

  useKeyboardShortcuts(shortcuts, {
    enabled: hasTaskSelected, // Only enable when task is selected
  });

  return (
    <div className="p-4">
      <button
        onClick={() => setHasTaskSelected(!hasTaskSelected)}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        {hasTaskSelected ? 'Deselect Task' : 'Select Task'}
      </button>
      {isEditMode && <div className="mt-4">Edit mode active! Press Escape to cancel.</div>}
    </div>
  );
}

/**
 * Example 3: Component that displays keyboard shortcut hints
 */
export function KeyboardShortcutsHelp({ shortcuts }: { shortcuts: KeyboardShortcut[] }) {
  // Group shortcuts by category
  const categories = {
    Navigation: shortcuts.filter((s) =>
      ['ArrowUp', 'ArrowDown', 'Enter'].includes(s.key)
    ),
    Actions: shortcuts.filter((s) =>
      ['e', 'Delete', 'Backspace', ' '].includes(s.key)
    ),
    Priority: shortcuts.filter((s) => ['1', '2', '3', '4'].includes(s.key)),
    Selectors: shortcuts.filter((s) => ['p', 'l', 'd'].includes(s.key)),
    Other: shortcuts.filter((s) =>
      ['k', '?', 'Escape'].includes(s.key) ||
      (s.ctrl && s.key === 'k') ||
      (s.meta && s.key === 'k')
    ),
  };

  return (
    <div className="space-y-6">
      {Object.entries(categories).map(([category, categoryShortcuts]) => {
        if (categoryShortcuts.length === 0) return null;

        return (
          <div key={category}>
            <h3 className="text-lg font-semibold mb-2">{category}</h3>
            <div className="space-y-2">
              {categoryShortcuts.map((shortcut, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-gray-700">{shortcut.description}</span>
                  <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-sm font-mono">
                    {formatShortcut(shortcut)}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Example 4: Tooltip showing keyboard shortcut
 */
export function ButtonWithShortcut({
  onClick,
  shortcut,
  children,
}: {
  onClick: () => void;
  shortcut: Omit<KeyboardShortcut, 'action' | 'description'>;
  children: React.ReactNode;
}) {
  const shortcutText = formatShortcut(shortcut);

  return (
    <button
      onClick={onClick}
      className="px-4 py-2 bg-blue-500 text-white rounded relative group"
      title={`Keyboard shortcut: ${shortcutText}`}
    >
      {children}
      <span className="ml-2 text-xs opacity-75">({shortcutText})</span>
    </button>
  );
}

/**
 * Example 5: Using the hook in a full page component
 */
export function TodosPageWithShortcuts() {
  const [todos, setTodos] = useState([
    { id: 1, title: 'Task 1', completed: false },
    { id: 2, title: 'Task 2', completed: false },
    { id: 3, title: 'Task 3', completed: true },
  ]);
  const [focusedIndex, setFocusedIndex] = useState(0);

  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'ArrowUp',
      description: 'Navigate up',
      action: () => setFocusedIndex((prev) => Math.max(0, prev - 1)),
    },
    {
      key: 'ArrowDown',
      description: 'Navigate down',
      action: () =>
        setFocusedIndex((prev) => Math.min(todos.length - 1, prev + 1)),
    },
    {
      key: ' ',
      description: 'Toggle completion',
      action: () => {
        setTodos((prevTodos) =>
          prevTodos.map((todo, index) =>
            index === focusedIndex
              ? { ...todo, completed: !todo.completed }
              : todo
          )
        );
      },
    },
    {
      key: 'Delete',
      description: 'Delete task',
      action: () => {
        if (confirm('Delete this task?')) {
          setTodos((prevTodos) =>
            prevTodos.filter((_, index) => index !== focusedIndex)
          );
          setFocusedIndex((prev) => Math.max(0, prev - 1));
        }
      },
    },
  ];

  useKeyboardShortcuts(shortcuts);

  return (
    <div className="p-4">
      <h1 className="text-2xl mb-4">My Tasks</h1>
      <div className="space-y-2">
        {todos.map((todo, index) => (
          <div
            key={todo.id}
            className={`p-3 border rounded ${
              index === focusedIndex ? 'ring-2 ring-blue-500' : ''
            } ${todo.completed ? 'bg-gray-100 line-through' : ''}`}
            onClick={() => setFocusedIndex(index)}
          >
            {todo.title}
          </div>
        ))}
      </div>
      <div className="mt-4 text-sm text-gray-600">
        Use arrow keys to navigate, Space to toggle completion, Delete to remove
      </div>
    </div>
  );
}
