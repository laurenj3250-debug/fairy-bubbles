import { useEffect, useCallback, useRef } from 'react';

/**
 * Keyboard shortcut configuration
 */
export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
  action: () => void;
}

/**
 * Options for the keyboard shortcuts hook
 */
export interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
  enableInInputs?: boolean;
}

/**
 * Platform detection utilities
 */
export const Platform = {
  isMac: () => {
    if (typeof navigator === 'undefined') return false;
    return /Mac|iPhone|iPod|iPad/i.test(navigator.platform) ||
           /Mac|iPhone|iPod|iPad/i.test(navigator.userAgent);
  },
  isWindows: () => {
    if (typeof navigator === 'undefined') return false;
    return /Win/i.test(navigator.platform) || /Win/i.test(navigator.userAgent);
  },
  isLinux: () => {
    if (typeof navigator === 'undefined') return false;
    return /Linux/i.test(navigator.platform) || /Linux/i.test(navigator.userAgent);
  },
  getModifierKey: () => {
    return Platform.isMac() ? '⌘' : 'Ctrl';
  },
};

/**
 * Check if an element is an input field where keyboard shortcuts should be disabled
 */
const isInputElement = (element: Element | null): boolean => {
  if (!element) return false;

  const tagName = element.tagName.toLowerCase();
  const inputTypes = ['text', 'password', 'email', 'search', 'tel', 'url', 'number', 'date', 'datetime-local', 'time', 'month', 'week'];

  // Check for input, textarea, or contenteditable
  if (tagName === 'textarea') return true;
  if (tagName === 'select') return true;
  if (element.getAttribute('contenteditable') === 'true') return true;
  if (tagName === 'input') {
    const type = (element as HTMLInputElement).type?.toLowerCase();
    return !type || inputTypes.includes(type);
  }

  return false;
};

/**
 * Check if a keyboard event matches a shortcut configuration
 */
const matchesShortcut = (event: KeyboardEvent, shortcut: KeyboardShortcut): boolean => {
  // Key must match (case-insensitive)
  const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
  if (!keyMatches) return false;

  // Check modifier keys
  // On Mac, cmd (metaKey) is primary modifier
  // On Windows/Linux, ctrl (ctrlKey) is primary modifier
  const isMac = Platform.isMac();

  // Check primary modifier (⌘/Ctrl)
  const primaryModifier = shortcut.ctrl || shortcut.meta;
  if (primaryModifier) {
    const hasModifier = isMac ? event.metaKey : event.ctrlKey;
    if (!hasModifier) return false;
  } else {
    // If shortcut doesn't require modifier, event shouldn't have it
    if (event.metaKey || event.ctrlKey) return false;
  }

  // Check shift key
  if (shortcut.shift !== undefined) {
    if (shortcut.shift !== event.shiftKey) return false;
  } else {
    // If shift is not specified, event shouldn't have it (unless it's a capital letter)
    if (event.shiftKey && shortcut.key.length === 1) return false;
  }

  // Check alt key
  if (shortcut.alt !== undefined) {
    if (shortcut.alt !== event.altKey) return false;
  } else {
    // If alt is not specified, event shouldn't have it
    if (event.altKey) return false;
  }

  return true;
};

/**
 * Custom hook for managing keyboard shortcuts
 *
 * Features:
 * - Platform detection (Mac vs Windows/Linux)
 * - Modifier key support (⌘/Ctrl, Shift, Alt)
 * - Respects input focus (doesn't trigger when typing in forms)
 * - Prevents conflicts with browser shortcuts
 * - Enables/disables shortcuts dynamically
 *
 * @example
 * ```tsx
 * const shortcuts = [
 *   {
 *     key: 'k',
 *     ctrl: true,
 *     description: 'Quick add task',
 *     action: () => openQuickAdd(),
 *   },
 *   {
 *     key: 'ArrowUp',
 *     description: 'Navigate up',
 *     action: () => moveUp(),
 *   },
 * ];
 *
 * useKeyboardShortcuts(shortcuts, { enabled: true });
 * ```
 */
export function useKeyboardShortcuts(
  shortcuts: KeyboardShortcut[],
  options: UseKeyboardShortcutsOptions = {}
) {
  const { enabled = true, enableInInputs = false } = options;
  const shortcutsRef = useRef(shortcuts);

  // Update shortcuts ref when they change
  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't handle shortcuts if disabled
    if (!enabled) return;

    // Don't handle shortcuts when typing in input fields (unless explicitly enabled)
    if (!enableInInputs && isInputElement(event.target as Element)) {
      return;
    }

    // Find matching shortcut
    const shortcut = shortcutsRef.current.find(s => matchesShortcut(event, s));

    if (shortcut) {
      // Prevent default browser behavior
      event.preventDefault();
      event.stopPropagation();

      // Execute the action
      try {
        shortcut.action();
      } catch (error) {
        console.error('Error executing keyboard shortcut:', error);
      }
    }
  }, [enabled, enableInInputs]);

  useEffect(() => {
    if (!enabled) return;

    // Add event listener
    document.addEventListener('keydown', handleKeyDown, true);

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [enabled, handleKeyDown]);

  return {
    platform: {
      isMac: Platform.isMac(),
      isWindows: Platform.isWindows(),
      isLinux: Platform.isLinux(),
      modifierKey: Platform.getModifierKey(),
    },
  };
}

/**
 * Format a keyboard shortcut for display
 *
 * @example
 * ```tsx
 * formatShortcut({ key: 'k', ctrl: true }) // Returns "⌘K" on Mac, "Ctrl+K" on Windows
 * ```
 */
export function formatShortcut(shortcut: Omit<KeyboardShortcut, 'action' | 'description'>): string {
  const parts: string[] = [];
  const isMac = Platform.isMac();

  // Add modifiers
  if (shortcut.ctrl || shortcut.meta) {
    parts.push(isMac ? '⌘' : 'Ctrl');
  }
  if (shortcut.shift) {
    parts.push(isMac ? '⇧' : 'Shift');
  }
  if (shortcut.alt) {
    parts.push(isMac ? '⌥' : 'Alt');
  }

  // Add key
  const keyMap: Record<string, string> = {
    'ArrowUp': '↑',
    'ArrowDown': '↓',
    'ArrowLeft': '←',
    'ArrowRight': '→',
    'Enter': '↵',
    'Escape': 'Esc',
    'Delete': 'Del',
    'Backspace': isMac ? '⌫' : 'Backspace',
    ' ': 'Space',
  };

  const displayKey = keyMap[shortcut.key] || shortcut.key.toUpperCase();
  parts.push(displayKey);

  return parts.join(isMac ? '' : '+');
}

/**
 * Predefined keyboard shortcuts for common actions
 * These match the shortcuts defined in the implementation plan
 */
export const DefaultShortcuts = {
  QUICK_ADD: { key: 'k', ctrl: true, meta: true },
  NAVIGATE_UP: { key: 'ArrowUp' },
  NAVIGATE_DOWN: { key: 'ArrowDown' },
  OPEN_TASK: { key: 'Enter' },
  EDIT_TASK: { key: 'e' },
  DELETE_TASK: { key: 'Delete' },
  DELETE_TASK_ALT: { key: 'Backspace' },
  TOGGLE_COMPLETE: { key: ' ' },
  PRIORITY_1: { key: '1' },
  PRIORITY_2: { key: '2' },
  PRIORITY_3: { key: '3' },
  PRIORITY_4: { key: '4' },
  PROJECT_SELECTOR: { key: 'p' },
  LABELS_SELECTOR: { key: 'l' },
  DUE_DATE: { key: 'd' },
  HELP: { key: '?' },
  CLOSE_MODAL: { key: 'Escape' },
} as const;

/**
 * Hook for managing keyboard shortcuts with a map-based approach
 * This is an alternative API that may be more convenient for some use cases
 *
 * @example
 * ```tsx
 * const handlers = {
 *   quickAdd: () => openQuickAdd(),
 *   navigateUp: () => moveUp(),
 * };
 *
 * useKeyboardShortcutsMap({
 *   'k+ctrl': handlers.quickAdd,
 *   'ArrowUp': handlers.navigateUp,
 * });
 * ```
 */
export function useKeyboardShortcutsMap(
  shortcutsMap: Record<string, () => void>,
  options: UseKeyboardShortcutsOptions = {}
) {
  const shortcuts: KeyboardShortcut[] = Object.entries(shortcutsMap).map(([key, action]) => {
    // Parse key string (e.g., "k+ctrl", "ArrowUp", "1")
    const parts = key.toLowerCase().split('+');
    const mainKey = parts[parts.length - 1];

    return {
      key: mainKey,
      ctrl: parts.includes('ctrl') || parts.includes('meta'),
      meta: parts.includes('ctrl') || parts.includes('meta'),
      shift: parts.includes('shift'),
      alt: parts.includes('alt'),
      description: key,
      action,
    };
  });

  return useKeyboardShortcuts(shortcuts, options);
}
